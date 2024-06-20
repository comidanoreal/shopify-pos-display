const express = require('express');
const path = require('path');
const app = express();

// Servir el archivo test.html desde la raíz del proyecto
app.use(express.static(path.join(__dirname)));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Simple server is running on port ${PORT}`);
});