// Global variables
let currentMode = 'investment';
let pieChart = null;
let lineChart = null;
let debounceTimer = null;

// Default values from application data
const defaultValues = {
    lumpsumAmount: 100000,
    investmentPeriod: 5,
    expectedReturn: 12,
    inflationRate: 6,
    goalAmount: 1000000,
    compoundingFrequency: 1,
    taxRate: 20
};

// Validation limits
const validationLimits = {
    lumpsumAmount: { min: 1000, max: 100000000 },
    goalAmount: { min: 50000, max: 1000000000 },
    period: { min: 1, max: 30 },
    expectedReturn: { min: 5, max: 25 },
    inflationRate: { min: 2, max: 12 },
    taxRate: { min: 0, max: 30 }
};

// Chart colors
const chartColors = ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5', '#5D878F', '#DB4545', '#D2BA4C', '#964325', '#944454', '#13343B'];

// DOM elements
const elements = {
    // Mode buttons
    investmentModeBtn: document.getElementById('investmentMode'),
    goalModeBtn: document.getElementById('goalMode'),
    
    // Input sections
    investmentInputs: document.getElementById('investmentInputs'),
    goalInputs: document.getElementById('goalInputs'),
    
    // Text inputs
    lumpsumAmountText: document.getElementById('lumpsumAmountText'),
    goalAmountText: document.getElementById('goalAmountText'),
    periodText: document.getElementById('periodText'),
    returnText: document.getElementById('returnText'),
    inflationText: document.getElementById('inflationText'),
    taxText: document.getElementById('taxText'),
    
    // Sliders
    lumpsumAmount: document.getElementById('lumpsumAmount'),
    goalAmount: document.getElementById('goalAmount'),
    period: document.getElementById('period'),
    expectedReturn: document.getElementById('expectedReturn'),
    inflationRate: document.getElementById('inflationRate'),
    taxRate: document.getElementById('taxRate'),
    
    // Error elements
    lumpsumAmountError: document.getElementById('lumpsumAmountError'),
    goalAmountError: document.getElementById('goalAmountError'),
    periodError: document.getElementById('periodError'),
    returnError: document.getElementById('returnError'),
    inflationError: document.getElementById('inflationError'),
    taxError: document.getElementById('taxError'),
    
    // Advanced options
    compoundingFreq: document.getElementById('compoundingFreq'),
    inflationToggle: document.getElementById('inflationToggle'),
    inflationOptions: document.getElementById('inflationOptions'),
    taxToggle: document.getElementById('taxToggle'),
    taxOptions: document.getElementById('taxOptions'),
    
    // Result displays
    initialInvestment: document.getElementById('initialInvestment'),
    estimatedGains: document.getElementById('estimatedGains'),
    maturityAmount: document.getElementById('maturityAmount'),
    inflationAdjustedCard: document.getElementById('inflationAdjustedCard'),
    inflationAdjustedValue: document.getElementById('inflationAdjustedValue'),
    postTaxCard: document.getElementById('postTaxCard'),
    postTaxValue: document.getElementById('postTaxValue'),
    requiredLumpsumCard: document.getElementById('requiredLumpsumCard'),
    requiredLumpsumValue: document.getElementById('requiredLumpsumValue'),
    effectiveReturn: document.getElementById('effectiveReturn'),
    totalReturnPercentage: document.getElementById('totalReturnPercentage'),
    
    // Comparison
    comparisonSection: document.getElementById('comparisonSection'),
    lumpsumComparison: document.getElementById('lumpsumComparison'),
    sipComparison: document.getElementById('sipComparison'),
    equivalentSIP: document.getElementById('equivalentSIP'),
    
    // Buttons
    resetBtn: document.getElementById('resetBtn'),
    compareBtn: document.getElementById('compareBtn'),
    exportBtn: document.getElementById('exportBtn'),
    
    // Charts and table
    pieChart: document.getElementById('pieChart'),
    lineChart: document.getElementById('lineChart'),
    breakdownTable: document.getElementById('breakdownTable')
};

// Utility functions
function formatCurrency(amount) {
    if (amount >= 10000000) {
        return `₹${(amount / 10000000).toFixed(2)}Cr`;
    } else if (amount >= 100000) {
        return `₹${(amount / 100000).toFixed(2)}L`;
    } else if (amount >= 1000) {
        return `₹${(amount / 1000).toFixed(0)}K`;
    } else {
        return `₹${Math.round(amount).toLocaleString('en-IN')}`;
    }
}

function formatNumber(num) {
    return num.toLocaleString('en-IN');
}

function formatPercentage(num, decimals = 1) {
    return `${num.toFixed(decimals)}%`;
}

function formatIndianCurrency(amount) {
    const num = parseInt(amount);
    if (isNaN(num)) return '₹0';
    return `₹${num.toLocaleString('en-IN')}`;
}

function parseIndianCurrency(currencyString) {
    if (!currencyString) return 0;
    // Remove currency symbol, spaces, and commas
    const cleanString = currencyString.replace(/[₹,\s]/g, '');
    return parseInt(cleanString) || 0;
}

function validateNumber(value, min, max, fieldName) {
    const num = parseFloat(value);
    if (isNaN(num)) {
        return { valid: false, error: `Please enter a valid number for ${fieldName}` };
    }
    if (num < min) {
        return { valid: false, error: `${fieldName} should be at least ${min}` };
    }
    if (num > max) {
        return { valid: false, error: `${fieldName} should not exceed ${max}` };
    }
    return { valid: true, value: num };
}

function showError(errorElement, textInput, message) {
    errorElement.textContent = message;
    errorElement.classList.add('show');
    textInput.classList.add('error');
}

function hideError(errorElement, textInput) {
    errorElement.classList.remove('show');
    textInput.classList.remove('error');
}

function debounce(func, wait) {
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(debounceTimer);
            func(...args);
        };
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(later, wait);
    };
}

// Input synchronization functions
function syncTextToSlider(textInput, slider, formatter, parser) {
    const value = parser ? parser(textInput.value) : parseFloat(textInput.value);
    if (!isNaN(value)) {
        slider.value = value;
    }
}

function syncSliderToText(slider, textInput, formatter) {
    const formattedValue = formatter(slider.value);
    textInput.value = formattedValue;
}

// Validation functions
function validateAmountInput(textInput, errorElement, min, max, fieldName) {
    const value = parseIndianCurrency(textInput.value);
    const validation = validateNumber(value, min, max, fieldName);
    
    if (!validation.valid) {
        showError(errorElement, textInput, validation.error);
        return false;
    } else {
        hideError(errorElement, textInput);
        return true;
    }
}

function validateNumberInput(textInput, errorElement, min, max, fieldName) {
    const value = parseFloat(textInput.value);
    const validation = validateNumber(value, min, max, fieldName);
    
    if (!validation.valid) {
        showError(errorElement, textInput, validation.error);
        return false;
    } else {
        hideError(errorElement, textInput);
        return true;
    }
}

// Lumpsum calculation functions
function calculateLumpsum(principal, rate, time, compoundingFreq = 1) {
    const r = rate / 100;
    const n = compoundingFreq;
    const t = time;
    
    return principal * Math.pow(1 + r / n, n * t);
}

function calculateRequiredLumpsum(futureValue, rate, time, compoundingFreq = 1) {
    const r = rate / 100;
    const n = compoundingFreq;
    const t = time;
    
    return futureValue / Math.pow(1 + r / n, n * t);
}

function calculateInflationAdjustedValue(amount, inflationRate, years) {
    return amount / Math.pow(1 + inflationRate / 100, years);
}

function calculatePostTaxAmount(maturityAmount, principal, taxRate) {
    const gains = maturityAmount - principal;
    const tax = gains * (taxRate / 100);
    return maturityAmount - tax;
}

function calculateEquivalentSIP(lumpsumAmount, rate, time) {
    // Calculate what monthly SIP would give similar final amount
    const monthlyRate = rate / 12 / 100;
    const months = time * 12;
    const futureValue = calculateLumpsum(lumpsumAmount, rate, time, 12);
    
    if (monthlyRate === 0) {
        return futureValue / months;
    }
    
    return futureValue / (((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate));
}

function calculateSIPFutureValue(monthlyAmount, rate, time) {
    const monthlyRate = rate / 12 / 100;
    const months = time * 12;
    
    if (monthlyRate === 0) {
        return monthlyAmount * months;
    }
    
    return monthlyAmount * (((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate));
}

// Main calculation function
function performCalculations() {
    const lumpsumAmount = parseIndianCurrency(elements.lumpsumAmountText.value);
    const goalAmount = parseIndianCurrency(elements.goalAmountText.value);
    const years = parseInt(elements.periodText.value) || parseInt(elements.period.value);
    const annualReturn = parseFloat(elements.returnText.value) || parseFloat(elements.expectedReturn.value);
    const compoundingFreq = parseInt(elements.compoundingFreq.value);
    const inflationRate = parseFloat(elements.inflationText.value) || parseFloat(elements.inflationRate.value);
    const taxRate = parseFloat(elements.taxText.value) || parseFloat(elements.taxRate.value);
    
    const isInflationAdjusted = elements.inflationToggle.checked;
    const isTaxConsidered = elements.taxToggle.checked;
    
    let results = {};
    
    if (currentMode === 'investment') {
        // Calculate maturity amount based on lumpsum investment
        const maturityAmount = calculateLumpsum(lumpsumAmount, annualReturn, years, compoundingFreq);
        const estimatedGains = maturityAmount - lumpsumAmount;
        const inflationAdjustedAmount = isInflationAdjusted ? 
            calculateInflationAdjustedValue(maturityAmount, inflationRate, years) : maturityAmount;
        const postTaxAmount = isTaxConsidered ? 
            calculatePostTaxAmount(maturityAmount, lumpsumAmount, taxRate) : maturityAmount;
        
        const effectiveAnnualReturn = (Math.pow(maturityAmount / lumpsumAmount, 1 / years) - 1) * 100;
        const totalReturnPercentage = (estimatedGains / lumpsumAmount) * 100;
        
        results = {
            initialInvestment: lumpsumAmount,
            estimatedGains,
            maturityAmount,
            inflationAdjustedAmount,
            postTaxAmount,
            effectiveAnnualReturn,
            totalReturnPercentage,
            requiredLumpsum: null
        };
        
    } else {
        // Calculate required lumpsum for goal amount
        const requiredLumpsum = calculateRequiredLumpsum(goalAmount, annualReturn, years, compoundingFreq);
        const estimatedGains = goalAmount - requiredLumpsum;
        const inflationAdjustedAmount = isInflationAdjusted ? 
            calculateInflationAdjustedValue(goalAmount, inflationRate, years) : goalAmount;
        const postTaxAmount = isTaxConsidered ? 
            calculatePostTaxAmount(goalAmount, requiredLumpsum, taxRate) : goalAmount;
        
        const effectiveAnnualReturn = (Math.pow(goalAmount / requiredLumpsum, 1 / years) - 1) * 100;
        const totalReturnPercentage = (estimatedGains / requiredLumpsum) * 100;
        
        results = {
            initialInvestment: requiredLumpsum,
            estimatedGains,
            maturityAmount: goalAmount,
            inflationAdjustedAmount,
            postTaxAmount,
            effectiveAnnualReturn,
            totalReturnPercentage,
            requiredLumpsum
        };
        
        // Update lumpsum amount display for goal mode
        elements.lumpsumAmountText.value = formatIndianCurrency(Math.round(requiredLumpsum));
        elements.lumpsumAmount.value = Math.round(requiredLumpsum);
    }
    
    updateResultsDisplay(results);
    updateCharts(results);
    generateBreakdownTable(results);
}

// Debounced calculation function
const debouncedCalculation = debounce(performCalculations, 300);

// Update results display
function updateResultsDisplay(results) {
    elements.initialInvestment.textContent = formatCurrency(results.initialInvestment);
    elements.estimatedGains.textContent = formatCurrency(results.estimatedGains);
    elements.maturityAmount.textContent = formatCurrency(results.maturityAmount);
    elements.effectiveReturn.textContent = formatPercentage(results.effectiveAnnualReturn);
    elements.totalReturnPercentage.textContent = formatPercentage(results.totalReturnPercentage);
    
    // Show/hide conditional cards
    if (elements.inflationToggle.checked) {
        elements.inflationAdjustedCard.classList.remove('hidden');
        elements.inflationAdjustedValue.textContent = formatCurrency(results.inflationAdjustedAmount);
    } else {
        elements.inflationAdjustedCard.classList.add('hidden');
    }
    
    if (elements.taxToggle.checked) {
        elements.postTaxCard.classList.remove('hidden');
        elements.postTaxValue.textContent = formatCurrency(results.postTaxAmount);
    } else {
        elements.postTaxCard.classList.add('hidden');
    }
    
    if (currentMode === 'goal') {
        elements.requiredLumpsumCard.classList.remove('hidden');
        elements.requiredLumpsumValue.textContent = formatCurrency(results.requiredLumpsum);
    } else {
        elements.requiredLumpsumCard.classList.add('hidden');
    }
}

// Update charts
function updateCharts(results) {
    updatePieChart(results);
    updateLineChart(results);
}

function updatePieChart(results) {
    const ctx = elements.pieChart.getContext('2d');
    
    if (pieChart) {
        pieChart.destroy();
    }
    
    pieChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Initial Investment', 'Estimated Gains'],
            datasets: [{
                data: [results.initialInvestment, results.estimatedGains],
                backgroundColor: [chartColors[0], chartColors[1]],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = formatCurrency(context.raw);
                            return `${context.label}: ${value}`;
                        }
                    }
                }
            }
        }
    });
}

function updateLineChart(results) {
    const ctx = elements.lineChart.getContext('2d');
    const years = parseInt(elements.periodText.value) || parseInt(elements.period.value);
    const annualReturn = parseFloat(elements.returnText.value) || parseFloat(elements.expectedReturn.value);
    const compoundingFreq = parseInt(elements.compoundingFreq.value);
    const principal = results.initialInvestment;
    
    // Generate data points for wealth growth
    const labels = [];
    const wealthData = [];
    
    for (let year = 0; year <= years; year++) {
        labels.push(`Year ${year}`);
        
        if (year === 0) {
            wealthData.push(principal);
        } else {
            const amount = calculateLumpsum(principal, annualReturn, year, compoundingFreq);
            wealthData.push(amount);
        }
    }
    
    if (lineChart) {
        lineChart.destroy();
    }
    
    lineChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Wealth Growth',
                    data: wealthData,
                    borderColor: chartColors[0],
                    backgroundColor: chartColors[0] + '30',
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: chartColors[0],
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Value: ${formatCurrency(context.raw)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            }
        }
    });
}

// Generate year-by-year breakdown table
function generateBreakdownTable(results) {
    const tbody = elements.breakdownTable.querySelector('tbody');
    tbody.innerHTML = '';
    
    const years = parseInt(elements.periodText.value) || parseInt(elements.period.value);
    const annualReturn = parseFloat(elements.returnText.value) || parseFloat(elements.expectedReturn.value);
    const compoundingFreq = parseInt(elements.compoundingFreq.value);
    const principal = results.initialInvestment;
    
    let currentBalance = principal;
    
    for (let year = 1; year <= years; year++) {
        const openingBalance = currentBalance;
        const newBalance = calculateLumpsum(principal, annualReturn, year, compoundingFreq);
        const interestEarned = newBalance - openingBalance;
        
        const row = tbody.insertRow();
        row.insertCell(0).textContent = year;
        row.insertCell(1).textContent = formatCurrency(openingBalance);
        row.insertCell(2).textContent = formatCurrency(interestEarned);
        row.insertCell(3).textContent = formatCurrency(newBalance);
        
        currentBalance = newBalance;
    }
}

// Comparison with SIP
function showComparison() {
    const lumpsumAmount = parseIndianCurrency(elements.lumpsumAmountText.value);
    const years = parseInt(elements.periodText.value) || parseInt(elements.period.value);
    const annualReturn = parseFloat(elements.returnText.value) || parseFloat(elements.expectedReturn.value);
    
    const lumpsumMaturity = calculateLumpsum(lumpsumAmount, annualReturn, years, 1);
    const equivalentMonthlySIP = lumpsumAmount / (years * 12);
    const sipMaturity = calculateSIPFutureValue(equivalentMonthlySIP, annualReturn, years);
    
    elements.lumpsumComparison.textContent = formatCurrency(lumpsumMaturity);
    elements.sipComparison.textContent = formatCurrency(sipMaturity);
    elements.equivalentSIP.textContent = formatNumber(Math.round(equivalentMonthlySIP));
    
    elements.comparisonSection.classList.remove('hidden');
    
    // Scroll to comparison section
    elements.comparisonSection.scrollIntoView({ behavior: 'smooth' });
}

// Event listeners setup
function setupEventListeners() {
    // Mode switching
    elements.investmentModeBtn.addEventListener('click', () => switchMode('investment'));
    elements.goalModeBtn.addEventListener('click', () => switchMode('goal'));
    
    // Lumpsum amount synchronization
    elements.lumpsumAmountText.addEventListener('input', (e) => {
        // Format the input as currency
        const rawValue = parseIndianCurrency(e.target.value);
        if (rawValue > 0) {
            e.target.value = formatIndianCurrency(rawValue);
            elements.lumpsumAmount.value = rawValue;
        }
        
        // Validate and update
        if (validateAmountInput(elements.lumpsumAmountText, elements.lumpsumAmountError, 
            validationLimits.lumpsumAmount.min, validationLimits.lumpsumAmount.max, 'Lumpsum Amount')) {
            debouncedCalculation();
        }
    });
    
    elements.lumpsumAmount.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        elements.lumpsumAmountText.value = formatIndianCurrency(value);
        hideError(elements.lumpsumAmountError, elements.lumpsumAmountText);
        performCalculations();
    });
    
    // Goal amount synchronization
    elements.goalAmountText.addEventListener('input', (e) => {
        const rawValue = parseIndianCurrency(e.target.value);
        if (rawValue > 0) {
            e.target.value = formatIndianCurrency(rawValue);
            elements.goalAmount.value = rawValue;
        }
        
        if (validateAmountInput(elements.goalAmountText, elements.goalAmountError,
            validationLimits.goalAmount.min, validationLimits.goalAmount.max, 'Goal Amount')) {
            debouncedCalculation();
        }
    });
    
    elements.goalAmount.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        elements.goalAmountText.value = formatIndianCurrency(value);
        hideError(elements.goalAmountError, elements.goalAmountText);
        performCalculations();
    });
    
    // Period synchronization
    elements.periodText.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        if (!isNaN(value)) {
            elements.period.value = value;
        }
        
        if (validateNumberInput(elements.periodText, elements.periodError,
            validationLimits.period.min, validationLimits.period.max, 'Investment Period')) {
            debouncedCalculation();
        }
    });
    
    elements.period.addEventListener('input', (e) => {
        elements.periodText.value = e.target.value;
        hideError(elements.periodError, elements.periodText);
        performCalculations();
    });
    
    // Return rate synchronization
    elements.returnText.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        if (!isNaN(value)) {
            elements.expectedReturn.value = value;
        }
        
        if (validateNumberInput(elements.returnText, elements.returnError,
            validationLimits.expectedReturn.min, validationLimits.expectedReturn.max, 'Expected Return')) {
            debouncedCalculation();
        }
    });
    
    elements.expectedReturn.addEventListener('input', (e) => {
        elements.returnText.value = e.target.value;
        hideError(elements.returnError, elements.returnText);
        performCalculations();
    });
    
    // Inflation rate synchronization
    elements.inflationText.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        if (!isNaN(value)) {
            elements.inflationRate.value = value;
        }
        
        if (validateNumberInput(elements.inflationText, elements.inflationError,
            validationLimits.inflationRate.min, validationLimits.inflationRate.max, 'Inflation Rate')) {
            debouncedCalculation();
        }
    });
    
    elements.inflationRate.addEventListener('input', (e) => {
        elements.inflationText.value = e.target.value;
        hideError(elements.inflationError, elements.inflationText);
        performCalculations();
    });
    
    // Tax rate synchronization
    elements.taxText.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        if (!isNaN(value)) {
            elements.taxRate.value = value;
        }
        
        if (validateNumberInput(elements.taxText, elements.taxError,
            validationLimits.taxRate.min, validationLimits.taxRate.max, 'Tax Rate')) {
            debouncedCalculation();
        }
    });
    
    elements.taxRate.addEventListener('input', (e) => {
        elements.taxText.value = e.target.value;
        hideError(elements.taxError, elements.taxText);
        performCalculations();
    });
    
    // Select inputs
    elements.compoundingFreq.addEventListener('change', performCalculations);
    
    // Toggle switches
    elements.inflationToggle.addEventListener('change', () => {
        if (elements.inflationToggle.checked) {
            elements.inflationOptions.classList.remove('hidden');
        } else {
            elements.inflationOptions.classList.add('hidden');
        }
        performCalculations();
    });
    
    elements.taxToggle.addEventListener('change', () => {
        if (elements.taxToggle.checked) {
            elements.taxOptions.classList.remove('hidden');
        } else {
            elements.taxOptions.classList.add('hidden');
        }
        performCalculations();
    });
    
    // Preset buttons
    const presetButtons = document.querySelectorAll('.preset-btn:not(.goal-preset)');
    presetButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const amount = parseInt(e.target.getAttribute('data-amount'));
            elements.lumpsumAmountText.value = formatIndianCurrency(amount);
            elements.lumpsumAmount.value = amount;
            hideError(elements.lumpsumAmountError, elements.lumpsumAmountText);
            performCalculations();
        });
    });
    
    // Goal preset buttons
    const goalPresetButtons = document.querySelectorAll('.goal-preset');
    goalPresetButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const amount = parseInt(e.target.getAttribute('data-amount'));
            elements.goalAmountText.value = formatIndianCurrency(amount);
            elements.goalAmount.value = amount;
            hideError(elements.goalAmountError, elements.goalAmountText);
            performCalculations();
        });
    });
    
    // Action buttons
    elements.resetBtn.addEventListener('click', resetCalculator);
    elements.compareBtn.addEventListener('click', showComparison);
    elements.exportBtn.addEventListener('click', exportResults);
    
    // Scenario cards
    const scenarioCards = document.querySelectorAll('.scenario-card');
    scenarioCards.forEach(card => {
        card.addEventListener('click', () => {
            const scenario = card.getAttribute('data-scenario');
            loadScenario(scenario);
        });
    });
    
    // Mobile optimization - set inputmode for numeric inputs
    elements.lumpsumAmountText.setAttribute('inputmode', 'numeric');
    elements.goalAmountText.setAttribute('inputmode', 'numeric');
    elements.periodText.setAttribute('inputmode', 'numeric');
    elements.returnText.setAttribute('inputmode', 'decimal');
    elements.inflationText.setAttribute('inputmode', 'decimal');
    elements.taxText.setAttribute('inputmode', 'numeric');
}

// Mode switching
function switchMode(mode) {
    currentMode = mode;
    
    if (mode === 'investment') {
        elements.investmentModeBtn.classList.add('mode-btn--active');
        elements.goalModeBtn.classList.remove('mode-btn--active');
        elements.investmentInputs.classList.remove('hidden');
        elements.goalInputs.classList.add('hidden');
    } else {
        elements.goalModeBtn.classList.add('mode-btn--active');
        elements.investmentModeBtn.classList.remove('mode-btn--active');
        elements.investmentInputs.classList.add('hidden');
        elements.goalInputs.classList.remove('hidden');
    }
    
    // Hide comparison section when switching modes
    elements.comparisonSection.classList.add('hidden');
    
    performCalculations();
}

// Load scenario
function loadScenario(scenarioType) {
    const scenarios = {
        conservative: { amount: 100000, period: 10, return: 8 },
        balanced: { amount: 200000, period: 7, return: 12 },
        aggressive: { amount: 500000, period: 5, return: 15 }
    };
    
    const scenario = scenarios[scenarioType];
    if (scenario) {
        elements.lumpsumAmountText.value = formatIndianCurrency(scenario.amount);
        elements.lumpsumAmount.value = scenario.amount;
        elements.periodText.value = scenario.period;
        elements.period.value = scenario.period;
        elements.returnText.value = scenario.return;
        elements.expectedReturn.value = scenario.return;
        
        // Clear any errors
        hideError(elements.lumpsumAmountError, elements.lumpsumAmountText);
        hideError(elements.periodError, elements.periodText);
        hideError(elements.returnError, elements.returnText);
        
        // Reset toggles
        elements.inflationToggle.checked = false;
        elements.inflationOptions.classList.add('hidden');
        elements.taxToggle.checked = false;
        elements.taxOptions.classList.add('hidden');
        elements.comparisonSection.classList.add('hidden');
        
        // Reset to annual compounding
        elements.compoundingFreq.value = 1;
        
        // Switch to investment mode if not already
        if (currentMode !== 'investment') {
            switchMode('investment');
        } else {
            performCalculations();
        }
    }
}

// Reset calculator
function resetCalculator() {
    // Reset text inputs
    elements.lumpsumAmountText.value = formatIndianCurrency(defaultValues.lumpsumAmount);
    elements.goalAmountText.value = formatIndianCurrency(defaultValues.goalAmount);
    elements.periodText.value = defaultValues.investmentPeriod;
    elements.returnText.value = defaultValues.expectedReturn;
    elements.inflationText.value = defaultValues.inflationRate;
    elements.taxText.value = defaultValues.taxRate;
    
    // Reset sliders
    elements.lumpsumAmount.value = defaultValues.lumpsumAmount;
    elements.goalAmount.value = defaultValues.goalAmount;
    elements.period.value = defaultValues.investmentPeriod;
    elements.expectedReturn.value = defaultValues.expectedReturn;
    elements.inflationRate.value = defaultValues.inflationRate;
    elements.taxRate.value = defaultValues.taxRate;
    elements.compoundingFreq.value = defaultValues.compoundingFrequency;
    
    // Clear all errors
    hideError(elements.lumpsumAmountError, elements.lumpsumAmountText);
    hideError(elements.goalAmountError, elements.goalAmountText);
    hideError(elements.periodError, elements.periodText);
    hideError(elements.returnError, elements.returnText);
    hideError(elements.inflationError, elements.inflationText);
    hideError(elements.taxError, elements.taxText);
    
    // Reset toggles
    elements.inflationToggle.checked = false;
    elements.inflationOptions.classList.add('hidden');
    elements.taxToggle.checked = false;
    elements.taxOptions.classList.add('hidden');
    elements.comparisonSection.classList.add('hidden');
    
    // Reset to investment mode
    switchMode('investment');
}

// Export results
function exportResults() {
    // Simulate export functionality
    const mode = currentMode === 'investment' ? 'Investment Amount' : 'Goal Amount';
    const amount = currentMode === 'investment' ? 
        elements.lumpsumAmountText.value : 
        elements.goalAmountText.value;
    
    alert(`Export functionality would generate a comprehensive PDF report with:
    
• ${mode} Mode Analysis
• Investment Amount: ${amount}
• Period: ${elements.periodText.value || elements.period.value} years
• Expected Return: ${elements.returnText.value || elements.expectedReturn.value}%
• Detailed year-by-year breakdown
• Interactive charts and graphs
• Risk analysis and recommendations
• Tax implications (if enabled)
• Inflation impact (if enabled)

This is a demo version. In a real implementation, this would generate and download a detailed PDF report.`);
}

// Initialize the application
function init() {
    setupEventListeners();
    performCalculations();
    
    // Add fade-in animation to main content
    document.querySelector('.calculator-wrapper').classList.add('fade-in');
}

// Start the application when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
