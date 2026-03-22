/* ================================================
   CHECKOUT PAGE - Interactive Functionality
   Script Kittens | 2026
================================================ */

document.addEventListener('DOMContentLoaded', () => {
    console.log('Checkout page loaded');
    initCursor();
    loadProductFromURL();
    initStepNavigation();
    initQuantityControls();
    initPaymentMethods();
    initCardInputs();
    initPromoCode();
    initRemoveItems();
    initFormValidation();
    console.log('All functions initialized');
});

/* ============ LOAD PRODUCT FROM URL ============ */
function loadProductFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const plan = urlParams.get('plan');

    if (plan) {
        const products = {
            'monthly': {
                name: 'Premium Monthly Plan',
                type: 'SUBSCRIPTION • Monthly Access',
                price: 29.99,
                originalPrice: 49.99,
                image: 'https://i.postimg.cc/sg838cbj/download-(7).gif',
                badge: 'BEST SELLER',
                features: ['All Premium Features', 'Priority Support', 'Monthly Updates', 'Discord Access']
            },
            'weekly': {
                name: 'Premium Weekly Plan',
                type: 'SUBSCRIPTION • Weekly Access',
                price: 9.99,
                originalPrice: 14.99,
                image: 'https://i.postimg.cc/RVgS19R6/jentop-lisabottom-fanfiction-Fanfiction-amreading-books-wattpad.gif',
                badge: 'NEW',
                features: ['All Premium Features', 'Standard Support', 'Weekly Updates', 'Discord Access']
            }
        };

        const product = products[plan];
        if (product) {
            updateCartWithProduct(product);
        }
    }
}

function updateCartWithProduct(product) {
    const cartItems = document.querySelector('.cart-items');
    cartItems.innerHTML = `
        <div class="cart-item">
            <div class="item-image">
                <img src="${product.image}" alt="${product.name}">
                <span class="item-badge ${product.badge === 'BEST SELLER' ? 'hot' : 'new'}">${product.badge}</span>
            </div>
            <div class="item-details">
                <h3 class="item-name">${product.name}</h3>
                <p class="item-type">${product.type}</p>
                <div class="item-features">
                    ${product.features.map(f => `<span><i class="fas fa-check"></i> ${f}</span>`).join('')}
                </div>
            </div>
            <div class="item-quantity">
                <button class="qty-btn minus"><i class="fas fa-minus"></i></button>
                <input type="number" value="1" min="1" max="10" class="qty-input">
                <button class="qty-btn plus"><i class="fas fa-plus"></i></button>
            </div>
            <div class="item-price">
                <span class="price-current">$${product.price.toFixed(2)}</span>
                ${product.originalPrice ? `<span class="price-original">$${product.originalPrice.toFixed(2)}</span>` : ''}
            </div>
            <button class="item-remove"><i class="fas fa-trash"></i></button>
        </div>
    `;

    // Re-initialize controls for the new items
    initQuantityControls();
    initRemoveItems();
    updateOrderSummary();
}

/* ============ CURSOR ============ */
function initCursor() {
    console.log('Standard system cursor active');
}

/* ============ STEP NAVIGATION ============ */
let currentStep = 1;

function initStepNavigation() {
    const nextButtons = document.querySelectorAll('.btn-next');
    const backButtons = document.querySelectorAll('.btn-back');

    nextButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const nextStep = parseInt(btn.dataset.next);
            if (validateCurrentStep()) {
                goToStep(nextStep);
            }
        });
    });

    backButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const backStep = parseInt(btn.dataset.back);
            goToStep(backStep);
        });
    });
}

function goToStep(stepNumber) {
    // Hide all steps
    document.querySelectorAll('.checkout-step').forEach(step => {
        step.classList.remove('active');
    });

    // Show target step
    const targetStep = document.querySelector(`.checkout-step[data-step="${stepNumber}"]`);
    if (targetStep) {
        targetStep.classList.add('active');
    }

    // Update progress indicators
    document.querySelectorAll('.progress-step').forEach((step, index) => {
        const stepNum = index + 1;
        if (stepNum < stepNumber) {
            step.classList.add('completed');
            step.classList.remove('active');
        } else if (stepNum === stepNumber) {
            step.classList.add('active');
            step.classList.remove('completed');
        } else {
            step.classList.remove('active', 'completed');
        }
    });

    // Update progress lines
    document.querySelectorAll('.progress-line').forEach((line, index) => {
        if (index < stepNumber - 1) {
            line.style.setProperty('--progress', '100%');
        } else {
            line.style.setProperty('--progress', '0%');
        }
    });

    currentStep = stepNumber;

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Subtle Step Entrance
    gsap.from('.checkout-step.active', {
        opacity: 0,
        duration: 0.4,
        ease: 'power2.out'
    });
}

function validateCurrentStep() {
    if (currentStep === 2) {
        const form = document.querySelector('.checkout-form');
        const requiredInputs = form.querySelectorAll('[required]');
        let isValid = true;

        requiredInputs.forEach(input => {
            if (!input.value.trim()) {
                input.style.borderColor = 'rgba(255, 0, 0, 0.5)';
                isValid = false;
                setTimeout(() => {
                    input.style.borderColor = '';
                }, 2000);
            }
        });

        if (!isValid) {
            showNotification('Please fill in all required fields', 'error');
        }

        return isValid;
    }

    if (currentStep === 3) {
        const activeMethod = document.querySelector('.payment-method.active');
        if (!activeMethod) {
            showNotification('Please select a payment method', 'error');
            return false;
        }

        const methodType = activeMethod.dataset.method;
        if (methodType === 'card') {
            const cardNumber = document.querySelector('.card-number-input').value;
            const cardName = document.querySelector('.card-name-input').value;
            const cardExpiry = document.querySelector('.card-expiry-input').value;
            const cardCvv = document.querySelector('.card-cvv-input').value;

            if (!cardNumber || !cardName || !cardExpiry || !cardCvv) {
                showNotification('Please complete all card details', 'error');
                return false;
            }
        }
    }

    return true;
}

/* ============ QUANTITY CONTROLS ============ */
function initQuantityControls() {
    document.querySelectorAll('.qty-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const qtyInput = btn.parentElement.querySelector('.qty-input');
            let currentValue = parseInt(qtyInput.value);

            if (btn.classList.contains('plus')) {
                const max = parseInt(qtyInput.max);
                if (currentValue < max) {
                    qtyInput.value = currentValue + 1;
                }
            } else if (btn.classList.contains('minus')) {
                const min = parseInt(qtyInput.min);
                if (currentValue > min) {
                    qtyInput.value = currentValue - 1;
                }
            }

            updateOrderSummary();
            animateButton(btn);
        });
    });

    document.querySelectorAll('.qty-input').forEach(input => {
        input.addEventListener('change', () => {
            const min = parseInt(input.min);
            const max = parseInt(input.max);
            let value = parseInt(input.value);

            if (value < min) input.value = min;
            if (value > max) input.value = max;

            updateOrderSummary();
        });
    });
}

/* ============ PAYMENT METHODS ============ */
function initPaymentMethods() {
    document.querySelectorAll('.payment-method').forEach(method => {
        method.addEventListener('click', () => {
            // Remove active from all methods
            document.querySelectorAll('.payment-method').forEach(m => {
                m.classList.remove('active');
            });

            // Add active to clicked method
            method.classList.add('active');

            // Show corresponding payment form
            const methodType = method.dataset.method;
            document.querySelectorAll('.payment-form').forEach(form => {
                form.classList.remove('active');
            });

            const targetForm = document.querySelector(`.payment-form[data-form="${methodType}"]`);
            if (targetForm) {
                targetForm.classList.add('active');
                gsap.from(targetForm, {
                    opacity: 0,
                    y: 20,
                    duration: 0.4,
                    ease: 'power2.out'
                });
            }
        });
    });
}

/* ============ CARD INPUTS ============ */
function initCardInputs() {
    const cardNumberInput = document.querySelector('.card-number-input');
    const cardNameInput = document.querySelector('.card-name-input');
    const cardExpiryInput = document.querySelector('.card-expiry-input');
    const cardCvvInput = document.querySelector('.card-cvv-input');

    const cardNumberDisplay = document.querySelector('.card-number');
    const cardHolderDisplay = document.querySelector('.card-holder');
    const cardExpiryDisplay = document.querySelector('.card-expiry');

    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\s/g, '');
            let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
            e.target.value = formattedValue;

            if (cardNumberDisplay) {
                cardNumberDisplay.textContent = formattedValue || '•••• •••• •••• ••••';
            }
        });
    }

    if (cardNameInput) {
        cardNameInput.addEventListener('input', (e) => {
            const value = e.target.value.toUpperCase();
            if (cardHolderDisplay) {
                cardHolderDisplay.textContent = value || 'CARD HOLDER';
            }
        });
    }

    if (cardExpiryInput) {
        cardExpiryInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = value.slice(0, 2) + '/' + value.slice(2, 4);
            }
            e.target.value = value;

            if (cardExpiryDisplay) {
                cardExpiryDisplay.textContent = value || 'MM/YY';
            }
        });
    }

    if (cardCvvInput) {
        cardCvvInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '');
        });
    }
}

/* ============ PROMO CODE ============ */
function initPromoCode() {
    const promoButton = document.querySelector('.promo-code button');
    const promoInput = document.querySelector('.promo-code input');

    if (promoButton && promoInput) {
        promoButton.addEventListener('click', () => {
            const code = promoInput.value.trim().toUpperCase();

            if (!code) {
                showNotification('Please enter a promo code', 'error');
                return;
            }

            // Simulate promo code validation
            const validCodes = {
                'KITTY20': 20,
                'SCRIPT10': 10,
                'WELCOME15': 15
            };

            if (validCodes[code]) {
                const discount = validCodes[code];
                showNotification(`Promo code applied! ${discount}% discount`, 'success');
                applyDiscount(discount);
                promoInput.value = '';
                promoInput.disabled = true;
                promoButton.disabled = true;
            } else {
                showNotification('Invalid promo code', 'error');
                promoInput.style.borderColor = 'rgba(255, 0, 0, 0.5)';
                setTimeout(() => {
                    promoInput.style.borderColor = '';
                }, 2000);
            }
        });

        promoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                promoButton.click();
            }
        });
    }
}

/* ============ REMOVE ITEMS ============ */
function initRemoveItems() {
    document.querySelectorAll('.item-remove').forEach(btn => {
        btn.addEventListener('click', () => {
            const cartItem = btn.closest('.cart-item');

            gsap.to(cartItem, {
                opacity: 0,
                x: 50,
                height: 0,
                marginBottom: 0,
                duration: 0.4,
                ease: 'power2.in',
                onComplete: () => {
                    cartItem.remove();
                    updateOrderSummary();
                    showNotification('Item removed from cart', 'info');

                    // Check if cart is empty
                    const remainingItems = document.querySelectorAll('.cart-item');
                    if (remainingItems.length === 0) {
                        showEmptyCart();
                    }
                }
            });
        });
    });
}

/* ============ FORM VALIDATION ============ */
function initFormValidation() {
    const form = document.querySelector('.checkout-form');
    if (!form) return;

    const inputs = form.querySelectorAll('input, select');

    inputs.forEach(input => {
        input.addEventListener('blur', () => {
            validateInput(input);
        });

        input.addEventListener('input', () => {
            if (input.classList.contains('error')) {
                validateInput(input);
            }
        });
    });
}

function validateInput(input) {
    const value = input.value.trim();
    let isValid = true;

    if (input.hasAttribute('required') && !value) {
        isValid = false;
    }

    if (input.type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        isValid = emailRegex.test(value);
    }

    if (input.type === 'tel' && value) {
        const phoneRegex = /^[\d\s\-\+\(\)]+$/;
        isValid = phoneRegex.test(value);
    }

    if (isValid) {
        input.classList.remove('error');
        input.style.borderColor = 'rgba(0, 255, 136, 0.5)';
        setTimeout(() => {
            input.style.borderColor = '';
        }, 1000);
    } else {
        input.classList.add('error');
        input.style.borderColor = 'rgba(255, 0, 0, 0.5)';
    }

    return isValid;
}

/* ============ HELPER FUNCTIONS ============ */
function updateOrderSummary() {
    const cartItems = document.querySelectorAll('.cart-item');
    let subtotal = 0;

    const summaryItems = document.querySelector('.summary-items');
    summaryItems.innerHTML = '';

    cartItems.forEach(item => {
        const name = item.querySelector('.item-name').textContent;
        const priceText = item.querySelector('.price-current').textContent;
        const price = parseFloat(priceText.replace('$', ''));
        const quantity = parseInt(item.querySelector('.qty-input').value);
        const itemTotal = price * quantity;

        subtotal += itemTotal;

        const summaryItem = document.createElement('div');
        summaryItem.className = 'summary-item';
        summaryItem.innerHTML = `
            <span>${name} ${quantity > 1 ? `(x${quantity})` : ''}</span>
            <span>$${itemTotal.toFixed(2)}</span>
        `;
        summaryItems.appendChild(summaryItem);
    });

    const discountRow = document.querySelector('.summary-row.discount span:last-child');
    const discountAmount = subtotal * 0.20;

    const total = subtotal - discountAmount;

    document.querySelector('.summary-row:nth-child(1) span:last-child').textContent = `$${subtotal.toFixed(2)}`;
    discountRow.textContent = `-$${discountAmount.toFixed(2)}`;
    document.querySelector('.summary-total span:last-child').textContent = `$${total.toFixed(2)}`;
}

function applyDiscount(percentage) {
    const discountRow = document.querySelector('.summary-row.discount');
    const discountLabel = discountRow.querySelector('span:first-child');
    discountLabel.innerHTML = `<i class="fas fa-tag"></i> Discount (${percentage}%)`;

    updateOrderSummary();
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;

    notification.style.cssText = `
        position: fixed;
        top: 30px;
        right: 30px;
        padding: 14px 24px;
        background: ${type === 'success' ? '#0a0a0a' : '#0a0a0a'};
        border: 1px solid ${type === 'success' ? '#333' : '#333'};
        border-radius: 4px;
        color: white;
        font-family: inherit;
        font-weight: 600;
        font-size: 13px;
        display: flex;
        align-items: center;
        gap: 12px;
        z-index: 10000;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        opacity: 0;
        transform: translateY(-20px);
        transition: all 0.3s ease;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';
    }, 10);

    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-20px)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function showEmptyCart() {
    const cartItems = document.querySelector('.cart-items');
    cartItems.innerHTML = `
        <div style="text-align: center; padding: 80px 20px;">
            <i class="fas fa-shopping-cart" style="font-size: 48px; color: #333; margin-bottom: 24px;"></i>
            <h3 style="font-family: 'Outfit', sans-serif; font-size: 24px; color: white; margin-bottom: 12px;">Your cart is empty</h3>
            <p style="color: #666; margin-bottom: 32px; font-size: 14px;">Add items to proceed with checkout.</p>
            <a href="https://script-kittens.com" style="display: inline-flex; align-items: center; gap: 12px; padding: 14px 32px; background: white; border-radius: 4px; color: black; text-decoration: none; font-weight: 700; text-transform: uppercase; font-size: 13px; letter-spacing: 0.1em;">
                <i class="fas fa-arrow-left"></i>
                <span>Return to Store</span>
            </a>
        </div>
    `;
}

function animateButton(btn) {
    gsap.to(btn, {
        scale: 1.2,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
        ease: 'power2.inOut'
    });
}


// ---- FULLSCREEN TOGGLE ----
const fullscreenBtn = document.getElementById('fullscreenBtn');
const fullscreenIcon = document.getElementById('fullscreenIcon');
if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => { });
            if (fullscreenIcon) fullscreenIcon.className = 'fas fa-compress';
        } else {
            document.exitFullscreen();
            if (fullscreenIcon) fullscreenIcon.className = 'fas fa-expand';
        }
        if (typeof gsap !== 'undefined') {
            gsap.timeline()
                .to(fullscreenBtn, { scale: 0.85, duration: 0.1 })
                .to(fullscreenBtn, { scale: 1.1, duration: 0.2, ease: 'back.out(3)' })
                .to(fullscreenBtn, { scale: 1, duration: 0.15 });
        }
    });
    document.addEventListener('fullscreenchange', () => {
        if (fullscreenIcon) {
            fullscreenIcon.className = document.fullscreenElement ? 'fas fa-compress' : 'fas fa-expand';
        }
    });
}
