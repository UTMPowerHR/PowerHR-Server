// Import mongoose
import mongoose from 'mongoose';

// Create a new mongoose schema

/*
    Example value

    {
        name: "John Doe",
        age: 25,
        email: "john@gmail.com,
        address: {
            street: "1234 Elm Street",
            city: "Springfield",
            state: "IL",
            zip: 62701
        }
    }

    Convert to type 
    
        {
            name: String,
            age: Number,
            email: String,
            address: {
                street: String,
                city: String,
                state: String,
                zip: Number
            }
        }
*/

const exampleSchema = new mongoose.Schema({
    // Define the schema properties

    name: {
        type: String,
        required: true,
    },

    age: Number,

    email: {
        type: String,
        required: true,
    },

    address: {
        street: {
            type: String,
        },
        city: String,
        state: String,
        zip: Number,
    },
});

// Add methods to the schema
exampleSchema.methods.getFullName = function () {
    return this.name;
};

// Create a model from the schema
const Example = mongoose.model('Example', exampleSchema);

// Export the model
export default Example;
