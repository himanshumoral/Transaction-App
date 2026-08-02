// Account check — page load hote hi
window.addEventListener('DOMContentLoaded', async function () {
    const response = await fetch('/api/account/');
    const data = await response.json();

    if (!data.hasAccount) {
        window.location.href = '/NoAccount.html';
    }
});

// ---- Logout ----

const logoutBtn = document.getElementById('logoutBtn');

logoutBtn.addEventListener('click', async function () {
    try {
        await fetch('/api/auth/logout', {
            method: 'POST'
        });

        window.location.href = '/login.html';

    } catch (error) {
        alert('Could not logout. Please try again.');
    }
});

// ---- Check balance ----

const checkBalanceBtn = document.getElementById('checkBalanceBtn');
const balanceText = document.getElementById('balanceText');

checkBalanceBtn.addEventListener('click', async function () {
    checkBalanceBtn.disabled = true;
    checkBalanceBtn.textContent = 'Checking...';

    try {
        const response = await fetch('/api/account/balance');
        const data = await response.json();

        balanceText.textContent = `₹${data.balance}`;
        balanceText.style.display = 'block';

    } catch (error) {
        balanceText.textContent = 'Could not fetch balance';
        balanceText.style.display = 'block';
    }

    checkBalanceBtn.disabled = false;
    checkBalanceBtn.textContent = 'Check balance';
});

// ---- Send money ----
const checkBalanceCard = document.getElementById('checkBalanceCard')
const sendMoneyForm = document.getElementById('sendMoneyForm');
const sendMoneyBtn = document.getElementById('sendMoneyBtn');
const sendStatusMsg = document.getElementById('sendStatusMsg');

sendMoneyForm.addEventListener('submit', async function (event) {
    event.preventDefault();

    const toUsername = document.getElementById('toUsername').value;
    const PIN = document.getElementById('pinInput').value;
    const amount = document.getElementById('amount').value;
    const idempotencyKey = crypto.randomUUID();

    sendMoneyBtn.disabled = true;
    sendMoneyBtn.textContent = 'Sending...';
    sendStatusMsg.style.display = 'none';
    const isSystemUser = localStorage.getItem('isSystemUser') === 'true';
    const endpoint = isSystemUser ? '/api/transaction/system/initial-funds' : '/api/transaction';

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ toUser: toUsername, amount: Number(amount), idempotencyKey, PIN })
        });

        const data = await response.json();

        sendStatusMsg.textContent = data.message;
        sendStatusMsg.style.color = response.ok ? '#2F6F4E' : '#B54747';
        sendStatusMsg.style.display = 'block';

        if (response.ok) {
            sendMoneyForm.reset();
            showSuccessModal(toUsername, amount, data.transaction);
        }

    } catch (error) {
        console.log(error);
        sendStatusMsg.textContent = 'Something went wrong. Please try again.';
        sendStatusMsg.style.color = '#B54747';
        sendStatusMsg.style.display = 'block';
    }

    sendMoneyBtn.disabled = false;
    sendMoneyBtn.textContent = 'Send';
});

// ---- Transaction history ----

async function loadTransactionHistory() {
    const listContainer = document.getElementById('transactionList');

    try {
        const response = await fetch('/api/transaction/history');
        const data = await response.json();

        if (data.transactions.length === 0) {
            listContainer.innerHTML = '<p class="empty-state">No transactions yet</p>';
            return;
        }

        listContainer.innerHTML = '';

        data.transactions.forEach(function (txn) {
            const item = document.createElement('div');
            item.className = 'transaction-item';

            let amountClass = 'positive';
            let sign = '+';
            let label = txn.otherUsername;

            if (txn.direction === 'SENT') {
                amountClass = 'negative';
                sign = '-';
            }

            if (txn.status !== 'COMPLETED') {
                amountClass = 'failed';
            }

            const date = new Date(txn.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
            });

            item.innerHTML = `
                <div class="txn-info">
                    <span class="txn-username">${label}</span>
                    <span class="txn-date">${date} · ${txn.status}</span>
                </div>
                <span class="txn-amount ${amountClass}">${sign}₹${txn.amount}</span>
            `;

            listContainer.appendChild(item);
        });

    } catch (error) {
        listContainer.innerHTML = '<p class="empty-state">Could not load transactions</p>';
    }
}

const successModal = document.getElementById('successModal');
const closeModalBtn = document.getElementById('closeModalBtn');

function showSuccessModal(username, amount, transaction) {
    document.getElementById('modalUsername').textContent = username;
    document.getElementById('modalAmount').textContent = `₹${amount}`;
    document.getElementById('modalTxnId').textContent = transaction._id;

    const time = new Date(transaction.createdAt || Date.now()).toLocaleString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    document.getElementById('modalTime').textContent = time;

    successModal.style.display = 'flex';
}

closeModalBtn.addEventListener('click', function () {
    successModal.style.display = 'none';
    loadTransactionHistory();   // Refresh the transaction list after closing the modal
});

loadTransactionHistory();