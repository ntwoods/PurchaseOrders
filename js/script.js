document.addEventListener('DOMContentLoaded', () => {
    const ordersGrid = document.getElementById('ordersGrid');
    const loadingMessage = document.getElementById('loadingMessage');
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const resetButton = document.getElementById('resetButton');
    const statusFilter = document.getElementById('statusFilter');
    const dispatcherFilter = document.getElementById('dispatcherFilter');

    // Base URL for your API (replace with your actual deployment URL)
    const API_BASE_URL = 'https://script.google.com/macros/s/AKfycbwPz265-M52aB27mF4810qB8G8q-L2d0nBv_S81h9iFkQv0P-YkR0m-P6v-WvF8L_s/exec'; // Example, replace this

    let allOrders = []; // To store all fetched orders for filtering/searching

    // Function to fetch and display orders
    async function loadOrders() {
        loadingMessage.style.display = 'block';
        ordersGrid.innerHTML = ''; // Clear existing orders
        try {
            const response = await fetch(API_BASE_URL + '?action=getOrders');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            // Check if data is an array and not empty
            if (Array.isArray(data) && data.length > 0) {
                allOrders = data;
                displayOrders(data);
                populateDispatcherFilter(data); // Populate filter options
            } else {
                ordersGrid.innerHTML = '<p class="loading">No orders found.</p>';
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
            ordersGrid.innerHTML = `<p class="loading error">Failed to load orders: ${error.message}</p>`;
        } finally {
            loadingMessage.style.display = 'none';
        }
    }

    // Function to display orders based on a given array
    function displayOrders(ordersToDisplay) {
        ordersGrid.innerHTML = ''; // Clear current display
        if (ordersToDisplay.length === 0) {
            ordersGrid.innerHTML = '<p class="loading">No matching orders found.</p>';
            return;
        }

        ordersToDisplay.forEach(order => {
            const card = document.createElement('div');
            card.className = 'order-card';
            card.innerHTML = `
                <h2>Order ID: ${order.orderId}</h2>
                <p><strong>Client Name:</strong> ${order.clientName}</p>
                <p><strong>Product:</strong> ${order.product}</p>
                <p><strong>Order Date:</strong> ${order.orderDate}</p>
                <p><strong>Status:</strong> <span class="status status-${order.status.toLowerCase()}">${order.status}</span></p>
                <p><strong>Dispatcher:</strong> ${order.dispatcher || 'N/A'}</p>
                ${order.holdUntil ? `<p><strong>Hold Until:</strong> ${order.holdUntil}</p>` : ''}
                ${order.holdRemark ? `<p><strong>Hold Remark:</strong> ${order.holdRemark}</p>` : ''}
                <div class="actions">
                    ${order.status.toLowerCase() !== 'dispatched' ?
                        `<button class="dispatch-btn" data-order-id="${order.orderId}">Dispatch</button>` : ''
                    }
                    ${order.status.toLowerCase() !== 'hold' ?
                        `<button class="hold-btn" data-order-id="${order.orderId}">Mark Hold</button>` : ''
                    }
                    ${order.status.toLowerCase() === 'hold' ?
                        `<button class="cancel-hold-btn" data-order-id="${order.orderId}">Cancel Hold</button>` : ''
                    }
                </div>
                <div id="hold-input-${order.orderId}" class="hold-input-group">
                    <label for="hold-until-${order.orderId}">Hold Until Date:</label>
                    <input type="date" id="hold-until-${order.orderId}" required>
                    <label for="hold-remark-${order.orderId}">Remark:</label>
                    <textarea id="hold-remark-${order.orderId}" rows="3" placeholder="Reason for hold (optional)"></textarea>
                    <button class="submit-hold-btn" data-order-id="${order.orderId}">Submit Hold</button>
                </div>
                <div id="feedback-${order.orderId}" class="action-feedback"></div>
            `;
            ordersGrid.appendChild(card);
        });

        addEventListenersToButtons();
    }

    // Populate dispatcher filter dropdown
    function populateDispatcherFilter(orders) {
        const dispatchers = new Set();
        orders.forEach(order => {
            if (order.dispatcher) {
                dispatchers.add(order.dispatcher);
            }
        });
        dispatcherFilter.innerHTML = '<option value="">All</option>'; // Reset
        dispatchers.forEach(dispatcher => {
            const option = document.createElement('option');
            option.value = dispatcher;
            option.textContent = dispatcher;
            dispatcherFilter.appendChild(option);
        });
    }

    // Add event listeners to dynamically created buttons
    function addEventListenersToButtons() {
        document.querySelectorAll('.dispatch-btn').forEach(button => {
            button.onclick = (event) => confirmDispatch(event.target.dataset.orderId);
        });

        document.querySelectorAll('.hold-btn').forEach(button => {
            button.onclick = (event) => toggleHoldInput(event.target.dataset.orderId);
        });

        document.querySelectorAll('.cancel-hold-btn').forEach(button => {
            button.onclick = (event) => confirmCancelHold(event.target.dataset.orderId);
        });

        document.querySelectorAll('.submit-hold-btn').forEach(button => {
            button.onclick = (event) => submitHoldAction(event.target.dataset.orderId);
        });
    }

    // Search and Filter logic
    function applyFiltersAndSearch() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const selectedStatus = statusFilter.value.toLowerCase();
        const selectedDispatcher = dispatcherFilter.value;

        const filteredOrders = allOrders.filter(order => {
            const matchesSearch = searchTerm === '' ||
                                  order.orderId.toLowerCase().includes(searchTerm) ||
                                  order.clientName.toLowerCase().includes(searchTerm) ||
                                  (order.dispatcher && order.dispatcher.toLowerCase().includes(searchTerm));
            
            const matchesStatus = selectedStatus === '' || order.status.toLowerCase() === selectedStatus;
            
            const matchesDispatcher = selectedDispatcher === '' || order.dispatcher === selectedDispatcher;

            return matchesSearch && matchesStatus && matchesDispatcher;
        });
        displayOrders(filteredOrders);
    }

    // Event Listeners for search and filters
    searchButton.addEventListener('click', applyFiltersAndSearch);
    searchInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            applyFiltersAndSearch();
        }
    });
    resetButton.addEventListener('click', () => {
        searchInput.value = '';
        statusFilter.value = '';
        dispatcherFilter.value = '';
        displayOrders(allOrders); // Show all orders again
    });
    statusFilter.addEventListener('change', applyFiltersAndSearch);
    dispatcherFilter.addEventListener('change', applyFiltersAndSearch);


    // --- API Interaction Functions ---

    async function confirmDispatch(orderId) {
        if (confirm(`Are you sure you want to dispatch Order ID: ${orderId}?`)) {
            await updateOrderStatus(orderId, 'dispatched', 'Dispatch');
        }
    }

    async function confirmCancelHold(orderId) {
        if (confirm(`Are you sure you want to cancel hold for Order ID: ${orderId}?`)) {
            await updateOrderStatus(orderId, 'pending', 'Cancel Hold', '', ''); // Reset hold data
        }
    }

    function toggleHoldInput(orderId) {
        const holdInputGroup = document.getElementById(`hold-input-${orderId}`);
        holdInputGroup.classList.toggle('show');
    }

    async function submitHoldAction(orderId) {
        const holdUntilInput = document.getElementById(`hold-until-${orderId}`);
        const holdRemarkInput = document.getElementById(`hold-remark-${orderId}`);
        const submitButton = document.querySelector(`#hold-input-${orderId} .submit-hold-btn`);

        const holdUntilDate = holdUntilInput.value;
        const holdRemark = holdRemarkInput.value;

        if (!holdUntilDate) {
            showFeedback(orderId, 'Please select a hold until date.', 'error');
            return;
        }

        submitButton.disabled = true;
        submitButton.textContent = 'Submitting...';

        try {
            await updateOrderStatus(orderId, 'hold', 'Hold', holdUntilDate, holdRemark);
            showFeedback(orderId, 'Hold action submitted successfully (check sheet for update)!', 'success');
            
            // Hide input and reset value
            document.getElementById(`hold-input-${orderId}`).classList.remove('show');
            holdUntilInput.value = '';
            holdRemarkInput.value = '';

            setTimeout(loadOrders, 2000); // Refresh orders after a short delay
        } catch (error) {
            console.error('Error submitting Hold action:', error);
            showFeedback(orderId, `Client-side error: ${error.message}`, 'error');
        } finally {
            setTimeout(() => {
                submitButton.disabled = false;
                submitButton.textContent = 'Mark Hold';
            }, 2000);
        }
    }

    // Generic function to update order status
    async function updateOrderStatus(orderId, newStatus, actionType, holdUntilDate = '', holdRemark = '') {
        const feedback = document.getElementById(`feedback-${orderId}`);
        const actionButton = document.querySelector(`button[data-order-id="${orderId}"][class*="${actionType.toLowerCase().replace(' ', '-')}-btn"]`); // More robust selector

        if (actionButton) {
            actionButton.disabled = true;
            actionButton.textContent = `${actionType}...`;
        }
        
        try {
            const response = await fetch(API_BASE_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'updateStatus',
                    orderId: orderId,
                    newStatus: newStatus,
                    holdUntil: holdUntilDate, // Send as YYYY-MM-DD
                    holdRemark: holdRemark
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server error: ${response.status} - ${errorText}`);
            }

            const result = await response.json();
            if (result.success) {
                showFeedback(orderId, `${actionType} successful! Refreshing orders...`, 'success');
                setTimeout(loadOrders, 2000); // Refresh orders after a short delay
            } else {
                throw new Error(result.error || `Unknown error during ${actionType}.`);
            }
        } catch (error) {
            console.error(`Error ${actionType}ing order ${orderId}:`, error);
            showFeedback(orderId, `Error ${actionType}: ${error.message}`, 'error');
        } finally {
            if (actionButton) {
                setTimeout(() => {
                    actionButton.disabled = false;
                    actionButton.textContent = actionType; // Restore original text
                }, 2000);
            }
        }
    }

    // Show feedback message
    function showFeedback(orderId, message, type) {
        const feedback = document.getElementById(`feedback-${orderId}`);
        feedback.textContent = message;
        feedback.className = `action-feedback ${type}`;
        feedback.style.display = 'block';
        
        // Hide feedback after 5 seconds
        setTimeout(() => {
            feedback.style.display = 'none';
        }, 5000);
    }

    // Initial load of orders when the page loads
    loadOrders();
});
