document.getElementById('connection-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const branchName = document.getElementById('branch_name').value;
    const userEmail = document.getElementById('user_email').value;
    const wsUrl = `ws://34.173.228.121/ws?branch_name=${branchName}&user_email=${userEmail}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = function() {
        console.log('Connected to WebSocket server');
    };

    ws.onmessage = function(event) {
        const orderData = JSON.parse(event.data);
        displayOrderDetails(orderData);
    };

    ws.onerror = function(error) {
        console.error('WebSocket error: ', error);
    };

    ws.onclose = function() {
        console.log('Disconnected from WebSocket server');
    };
});

function displayOrderDetails(orderData) {
    const orderDetailsElement = document.getElementById('order-details');
    orderDetailsElement.innerHTML = ''; // Clear previous content

    const lineItems = orderData.line_items || [];
    const totalPrice = orderData.total_price || 0;

    lineItems.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.classList.add('order-item');
        itemElement.innerHTML = `
            <p>Product: ${item.name}</p>
            <p>Quantity: ${item.quantity}</p>
            <p>Subtotal: ${item.price * item.quantity}</p>
        `;
        orderDetailsElement.appendChild(itemElement);
    });

    const totalElement = document.createElement('div');
    totalElement.classList.add('order-total');
    totalElement.innerHTML = `<p>Total Price: ${totalPrice}</p>`;
    orderDetailsElement.appendChild(totalElement);
}