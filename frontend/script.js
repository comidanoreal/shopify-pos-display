document.getElementById('connectionForm').addEventListener('submit', function (event) {
    event.preventDefault();
    const branchName = document.getElementById('branchName').value;
    const userEmail = document.getElementById('userEmail').value;
    const socket = new WebSocket(`ws://${window.location.host}/ws?branch_name=${branchName}&user_email=${userEmail}`);

    socket.addEventListener('message', function (event) {
        const data = JSON.parse(event.data);
        if (data.line_items && data.total_price) {
            const lineItems = document.getElementById('lineItems');
            lineItems.innerHTML = '';
            data.line_items.forEach(item => {
                const li = document.createElement('li');
                li.textContent = `${item.name} - ${item.quantity} x ${item.price}`;
                lineItems.appendChild(li);
            });
            document.getElementById('totalPrice').textContent = data.total_price;
        }
    });

    socket.addEventListener('open', function () {
        console.log('Connected to WebSocket server');
    });

    socket.addEventListener('close', function () {
        console.log('Disconnected from WebSocket server');
    });
});
