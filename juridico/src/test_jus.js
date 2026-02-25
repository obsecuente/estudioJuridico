
import axios from 'axios';

async function testJUS() {
    try {
        console.log("Testing JUS endpoint...");
        const response = await axios.get('http://localhost:4000/api/configuracion/jus');
        console.log('API Response:', response.data);
    } catch (error) {
        if (error.response) {
            console.error('Error Status:', error.response.status);
            console.error('Error Data:', error.response.data);
        } else {
            console.error('Error Message:', error.message);
            if (error.code) console.error('Error Code:', error.code);
        }
    }
}

testJUS();
