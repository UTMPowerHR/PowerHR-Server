# PowerHR
# PowerHR-Server
## Getting started

### Clone the Repository

To clone the repository, use the following command:

```sh
git clone https://github.com/UTMPowerHR/PowerHR-Server.git
cd powerhr-server
```

### Install Dependencies

To install the necessary dependencies, run:

```sh
npm install or npm i
```

### Environment Variables

Ensure you have a `.env` file in the root directory of your project with the necessary environment variables. Here is an example of what the `.env` file might look like:

```env
# Example .env file
DB_URL = your_mongodb_database_url
NODE_ENV = 'development'
JWT_SECRET = your_secret_key
EMAIL = your_email
EMAIL_PASSWORD = your_access_token
FRONTEND_URL = your_frontend_url
FIREBASE_API_KEY = your_firebase_api_key
FIREBASE_AUTH_DOMAIN = your_firebase_auth_domain
FIREBASE_PROJECT_ID = your_firebase_project_id
FIREBASE_STORAGE_BUCKET = your_firebase_storage_bucket
FIREBASE_MESSAGING_SENDER_ID = your_firebase_messaging_sender_id
FIREBASE_APP_ID = your_firebase_app_id
FIREBASE_MEASUREMENT_ID = your_firebase_measurement_id
```

### Run the Application in Development

To start the application in development mode, use:

```sh
npm run dev
```

Once the application in runnning, you can open your browser and navigate to
`http://localhost:3000` to access the application.

#### Swagger API Documentation
The project includes Swagger for API documentation. You can access it by navigating to
`http://localhost:3000/docs`.

## Development Operations (DevOps)
## GitHub Action (Active)
This version use Vercel to deploy.

Here's a detailed `README.md` that explains each step in the workflow, with the YAML and descriptions for each job and step:


### Vercel Production Deployment Workflow

This GitHub Actions workflow is designed to automate the build, testing, and deployment process of a Node.js project to Vercel in the production environment. It ensures continuous integration and continuous deployment (CI/CD) for the `main` branch.

### Prerequisites

Before using this workflow, ensure that the following secrets are added to your GitHub repository:
- `VERCEL_ORG_ID`: Your Vercel organization ID.
- `VERCEL_PROJECT_ID`: Your Vercel project ID.
- `VERCEL_TOKEN`: Your Vercel API token.
- `GITHUB_TOKEN`: Provided automatically by GitHub for actions to authenticate with GitHub's API.


## GitLab CI/CD (Ready)
This repository contains the CI/CD pipeline configuration for the PowerHR Server project. The pipeline includes stages for building, testing, pushing, and deploying the Docker image.

This version use Docker, SonarCloud, JMeter and Render.

### 1\. Build

The `build` stage builds and pushes the Docker image to the GitLab Container Registry.

```yaml

build:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  script:
    - echo $CI_REGISTRY_PASSWORD | docker login -u $CI_REGISTRY_USER --password-stdin $CI_REGISTRY
    - docker build -t $DOCKER_IMAGE .
    - docker push $DOCKER_IMAGE
  rules:
    - if: '$CI_PIPELINE_SOURCE != "schedule" && $CI_PIPELINE_SOURCE == "merge_request_event"'
    - if: '$CI_COMMIT_BRANCH == "main" && $CI_PIPELINE_SOURCE != "schedule"'
```

### 2\. Test

The `test` stage includes several jobs for static analysis, linting, formatting checks, unit tests, and performance testing with JMeter.

#### Static Application Security Testing (SAST)

```yaml

sast:
  stage: test
include:
  - template: Security/SAST.gitlab-ci.yml
```

#### SonarCloud Check

```yaml

sonarcloud-check:
  image:
    name: sonarsource/sonar-scanner-cli:latest
    entrypoint: [""]
  cache:
    key: "${CI_JOB_NAME}"
    paths:
      - .sonar/cache
  script:
    - sonar-scanner
  rules:
    - if: '$CI_PIPELINE_SOURCE != "schedule" && $CI_PIPELINE_SOURCE == "merge_request_event"'
    - if: '$CI_COMMIT_BRANCH == "main" && $CI_PIPELINE_SOURCE != "schedule"'
```

#### Lint Check

```yaml

lint_check:
  stage: test
  image: docker:latest
  services:
    - docker:dind
  script:
    - echo $CI_REGISTRY_PASSWORD | docker login -u $CI_REGISTRY_USER --password-stdin $CI_REGISTRY
    - docker pull $DOCKER_IMAGE
    - mkdir -p report
    - docker run --rm -v $(pwd)/report:/app/report $DOCKER_IMAGE npm run lint
  rules:
    - if: '$CI_PIPELINE_SOURCE != "schedule" && $CI_PIPELINE_SOURCE == "merge_request_event"'
    - if: '$CI_COMMIT_BRANCH == "main" && $CI_PIPELINE_SOURCE != "schedule"'
```

#### Format Check

```yaml

format_check:
  stage: test
  image: docker:latest
  services:
    - docker:dind
  script:
    - echo $CI_REGISTRY_PASSWORD | docker login -u $CI_REGISTRY_USER --password-stdin $CI_REGISTRY
    - docker pull $DOCKER_IMAGE
    - mkdir -p report
    - docker run --rm -v $(pwd)/report:/app/report $DOCKER_IMAGE npm run prettier:check
  rules:
    - if: '$CI_PIPELINE_SOURCE != "schedule" && $CI_PIPELINE_SOURCE == "merge_request_event"'
    - if: '$CI_COMMIT_BRANCH == "main" && $CI_PIPELINE_SOURCE != "schedule"'
```

#### Unit Tests

```yaml

unit_test:
  stage: test
  image: docker:latest
  services:
    - docker:dind
  script:
    - echo $CI_REGISTRY_PASSWORD | docker login -u $CI_REGISTRY_USER --password-stdin $CI_REGISTRY
    - docker pull $DOCKER_IMAGE
    - mkdir -p report
    - docker run --rm -v $(pwd)/report:/app/report $DOCKER_IMAGE npm run test:coverage
  artifacts:
    paths:
      - report/junit-report.xml
    reports:
      junit: report/junit-report.xml
    when: always
  rules:
    - if: '$CI_PIPELINE_SOURCE != "schedule" && $CI_PIPELINE_SOURCE == "merge_request_event"'
    - if: '$CI_COMMIT_BRANCH == "main" && $CI_PIPELINE_SOURCE != "schedule"'
```

#### JMeter Performance Tests

```yaml

jmeter_test:
  stage: test
  image: docker:latest
  services:
    - docker:dind
  script:
    - echo $CI_REGISTRY_PASSWORD | docker login -u $CI_REGISTRY_USER --password-stdin $CI_REGISTRY
    - docker pull $DOCKER_IMAGE
    - mkdir -p jmeter/results jmeter/dashboard
    - docker run --rm -v $(pwd)/jmeter:/jmeter -w /app --add-host=host.docker.internal:host-gateway $DOCKER_IMAGE sh -c "jmeter -n -t /jmeter/Powerhr-server.jmx -l /jmeter/results/result.csv -e -o /jmeter/dashboard"
  artifacts:
    paths:
      - jmeter/results/result.csv
      - jmeter/dashboard/
    when: always
  rules:
    - if: '$CI_PIPELINE_SOURCE == "schedule"'
```

### 3\. Push

The `push` stage pushes the Docker image to Docker Hub.

```yaml

push_to_dockerhub:
  stage: push
  image: docker:latest
  services:
    - docker:dind
  script:
    - echo "Logging in to GitLab Container Registry"
    - echo $CI_REGISTRY_PASSWORD | docker login -u $CI_REGISTRY_USER --password-stdin $CI_REGISTRY
    - echo "Pulling image from GitLab Container Registry"
    - docker pull $DOCKER_IMAGE
    - docker logout
    - echo "Logging in to Docker Hub"
    - echo $DOCKER_HUB_PASSWORD | docker login -u $DOCKER_HUB_USERNAME --password-stdin
    - echo "Tagging image for Docker Hub"
    - docker tag $DOCKER_IMAGE iymjalil/powerhr-server:latest
    - echo "Pushing image to Docker Hub"
    - docker push iymjalil/powerhr-server:latest
  rules:
    - if: '$CI_COMMIT_BRANCH == "main" && $CI_PIPELINE_SOURCE != "schedule"'
    - if: '$CI_PIPELINE_SOURCE == "merge_request_event" && $CI_PIPELINE_SOURCE != "schedule"'
```

### 4\. Deploy

The `deploy` stage triggers a deployment on Render.

```yaml

deploy_to_render:
  stage: deploy
  image: curlimages/curl:latest
  script:
    - echo "Triggering deployment on Render"
    - curl -X POST https://api.render.com/deploy/srv-cq0jcvqju9rs73au43a0?key=WwpMoEGGmuc
  rules:
    - if: '$CI_COMMIT_BRANCH == "main" && $CI_PIPELINE_SOURCE != "schedule"'
    - if: '$CI_PIPELINE_SOURCE == "merge_request_event" && $CI_PIPELINE_SOURCE != "schedule"'
```

Variables
---------

*   `DOCKER_IMAGE`: The Docker image name.
*   `SONAR_USER_HOME`: The directory for SonarQube user home.
*   `GIT_DEPTH`: Set to `0` for full history clone.


Deployment
----------

You can access the deployed application at [PowerHR Server on Render](https://powerhr-server.onrender.com).

Docker Hub
----------

The Docker image for this project is available on Docker Hub: [iymjalil/powerhr-server](https://hub.docker.com/r/iymjalil/powerhr-server).



License
-------

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

* * *
