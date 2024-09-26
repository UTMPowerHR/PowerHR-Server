// Import Example model
import Example from '../../models/example/example.js';

// Create a new class called ExampleController
class ExampleController {
    // Create a new example object
    async create(example) {
        // Create a new example object
        await Example.create(example);

        /* 
        To save data to database

        1. Using create method

        await Example.create(example); // Automatically saves to database


        2. Using save method (usually used to return the saved object)

        const newExample = new Example(example); //Not saved to database
        await newExample.save(); // Save to database
        return newExample;
        */
    }

    // Update an example object
    async update(example) {
        // Update the example object
        await Example.findByIdAndUpdate(example._id, example);
    }

    async delete(id) {
        // Delete the example object
        await Example.findByIdAndDelete(id);
    }
}

// Export the ExampleController class
export default ExampleController;
