document.getElementById('connectForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const branchName = document.getElementById('branchName').value;
    const userEmail = document.getElementById('userEmail').value;

    const ws = new WebSocket(`ws://${window.location.host}/ws?branch_name=${branchName}&user_email=${userEmail}`);

    ws.onmessage = function(event) {
        const message = JSON.parse(event.data);
        const messagesDiv = document.getElementById('messages');
        const messageElement = document.createElement('div');

        let lineItemsContent = '';
        message.line_items.forEach(item => {
            lineItemsContent += `
                <p><strong>Product:</strong> ${item.product_name}</p>
                <p><strong>Quantity:</strong> ${item.quantity}</p>
                <p><strong>Price:</strong> ${item.price}</p>
                <p><strong>Subtotal:</strong> ${item.quantity * item.price}</p>
                <hr>
            `;
        });

        messageElement.innerHTML = `
            <p><strong>Branch:</strong> ${branchName}</p>
            <p><strong>User:</strong> ${userEmail}</p>
            ${lineItemsContent}
            <p><strong>Total Price:</strong> ${message.total_price}</p>
            <hr>
        `;
        messagesDiv.appendChild(messageElement);
    };

    ws.onopen = function() {
        console.log('Connected to WebSocket');
    };

    ws.onclose = function() {
        console.log('Disconnected from WebSocket');
    };
});
