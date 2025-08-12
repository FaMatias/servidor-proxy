// Importamos las librerías necesarias
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');

// Inicializamos la aplicación de Express
const app = express();
const port = process.env.PORT || 3000;

// Middleware para procesar las solicitudes JSON
app.use(bodyParser.json());
// Middleware para permitir solicitudes desde cualquier origen (necesario para GitHub Pages)
app.use(cors());

// Definimos nuestra clave de API como una variable de entorno.
// Esto es CRUCIAL para la seguridad.
// En Vercel o Render, esta variable se configura en el dashboard.
const apiKey = process.env.GEMINI_API_KEY;

// Endpoint para generar el itinerario de viaje
app.post('/api/viajes', async (req, res) => {
    // Tomamos los datos del cuerpo de la solicitud
    const { destino, dias, presupuesto, intereses, idioma } = req.body;

    // Construimos el prompt para la API de Gemini
    const prompt = `Genera un itinerario de viaje detallado para ${dias} días en ${destino}, con un presupuesto ${presupuesto} y enfocado en los siguientes intereses: ${intereses}. Por favor, genera el itinerario completamente en ${idioma}. Dame un objeto JSON con el título del viaje y una lista de objetos, uno por cada día. Cada objeto de día debe incluir: el número de día, una descripción general del día, una lista de lugares a visitar, una lista de comida sugerida y una lista de actividades.`;
    
    const chatHistory = [{ 
        role: "user", 
        parts: [{ text: prompt }] 
    }];

    const payload = {
        contents: chatHistory,
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
                type: "OBJECT",
                properties: {
                    "titulo_viaje": { "type": "STRING" },
                    "dias": {
                        "type": "ARRAY",
                        "items": {
                            "type": "OBJECT",
                            "properties": {
                                "dia": { "type": "NUMBER" },
                                "descripcion": { "type": "STRING" },
                                "lugares_a_visitar": { "type": "ARRAY", "items": { "type": "STRING" } },
                                "comida_sugerida": { "type": "ARRAY", "items": { "type": "STRING" } },
                                "actividades": { "type": "ARRAY", "items": { "type": "STRING" } }
                            }
                        }
                    }
                }
            }
        }
    };

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
    
    // Hacemos la llamada segura a la API de Gemini
    try {
        const apiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!apiResponse.ok) {
            // Reenviamos el error de la API al cliente
            throw new Error(`API error: ${apiResponse.statusText}`);
        }

        const apiResult = await apiResponse.json();
        // Devolvemos la respuesta de la API al cliente
        res.json(apiResult);
    } catch (error) {
        console.error('Error in proxy server:', error);
        res.status(500).json({ error: 'Error processing your request.' });
    }
});

// Iniciamos el servidor
app.listen(port, () => {
    console.log(`Proxy server listening at http://localhost:${port}`);
});
