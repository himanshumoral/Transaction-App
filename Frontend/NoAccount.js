const openPinModalBtn = document.getElementById('openPinModalBtn');
const pinModal = document.getElementById('pinModal');
const cancelPinBtn = document.getElementById('cancelPinBtn');
const createAccountForm = document.getElementById('createAccountForm');
const createAccountBtn = document.getElementById('createAccountBtn');
const modalStatusMsg = document.getElementById('modalStatusMsg');

// open the modal
openPinModalBtn.addEventListener('click', function () {
    pinModal.style.display = 'flex';
});

// close the modal
cancelPinBtn.addEventListener('click', function () {
    pinModal.style.display = 'none';
    createAccountForm.reset();
    modalStatusMsg.style.display = 'none';
});

// Submit the PIN and create the account
createAccountForm.addEventListener('submit', async function (event) {
    event.preventDefault();

    const pin = document.getElementById('pinInput').value;

    createAccountBtn.disabled = true;
    createAccountBtn.textContent = 'Creating...';

    try {
        const response = await fetch('/api/account/Create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ PIN: pin })
        });

        const data = await response.json();

        if (!response.ok) {
            modalStatusMsg.textContent = data.message || 'Could not create account';
            modalStatusMsg.style.color = '#F17B7B';
            modalStatusMsg.style.display = 'block';
            createAccountBtn.disabled = false;
            createAccountBtn.textContent = 'Save & continue';
            return;
        }

        window.location.href = '/Dashboard.html';

    } catch (error) {
        modalStatusMsg.textContent = 'Something went wrong. Please try again.';
        modalStatusMsg.style.color = '#F17B7B';
        modalStatusMsg.style.display = 'block';
        createAccountBtn.disabled = false;
        createAccountBtn.textContent = 'Save & continue';
    }
});