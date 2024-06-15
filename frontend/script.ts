const branchName = 'your-branch-name'; // Replace with actual branch name
const userEmail = 'your-user-email'; // Replace with actual user email

const ws = new WebSocket(`ws://your-server-ip-or-domain/ws?branch_name=${branchName}&user_email=${userEmail}`);

ws.onmessage = (event) => {
    const order = JSON.parse(event.data);
    updateOrderDetails(order);
};

function updateOrderDetails(order) {
    const userInfo = document.getElementById('user-info');
    const lineItems = document.getElementById('line-items');
    const totalPrice = document.getElementById('total-price');

    userInfo.textContent = `Usuario: ${userEmail}, Sucursal: ${branchName}`;
    lineItems.innerHTML = '';

    order.line_items.forEach(item => {
        const li = document.createElement('li');
        li.textContent = `${item.name}: ${item.quantity} x ${item.price}`;
        lineItems.appendChild(li);
    });

    totalPrice.textContent = `Total: $${order.total_price}`;
}
