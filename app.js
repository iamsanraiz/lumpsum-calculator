// Global variables
let currentMode = 'investment';
let pieChart = null;
let lineChart = null;

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
    
    // Sliders and values
    lumpsumAmount: document.getElementById('lumpsumAmount'),
    lumpsumAmountValue: document.getElementById('lumpsumAmountValue'),
    goalAmount: document.getElementById('goalAmount'),
    goalAmountValue: document.getElementById('goalAmountValue'),
    period: document.getElementById('period'),
    periodValue: document.getElementById('periodValue'),
    expectedReturn: document.getElementById('expectedReturn'),
    returnValue: document.getElementById('returnValue'),
    
    // Advanced options
    compoundingFreq: document.getElementById('compoundingFreq'),
    inflationToggle: document.getElementById('inflationToggle'),
    inflationOptions: document.getElementById('inflationOptions'),
    inflationRate: document.getElementById('inflationRate'),
    inflationValue: document.getElementById('inflationValue'),
    taxToggle: document.getElementById('taxToggle'),
    taxOptions: document.getElementById('taxOptions'),
    taxRate: document.getElementById('taxRate'),
    taxValue: document.getElementById('taxValue'),
    
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
    const lumpsumAmount = parseInt(elements.lumpsumAmount.value);
    const goalAmount = parseInt(elements.goalAmount.value);
    const years = parseInt(elements.period.value);
    const annualReturn = parseFloat(elements.expectedReturn.value);
    const compoundingFreq = parseInt(elements.compoundingFreq.value);
    const inflationRate = parseFloat(elements.inflationRate.value);
    const taxRate = parseFloat(elements.taxRate.value);
    
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
        elements.lumpsumAmountValue.textContent = formatNumber(Math.round(requiredLumpsum));
    }
    
    updateResultsDisplay(results);
    updateCharts(results);
    generateBreakdownTable(results);
}

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
    const years = parseInt(elements.period.value);
    const annualReturn = parseFloat(elements.expectedReturn.value);
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
    
    const years = parseInt(elements.period.value);
    const annualReturn = parseFloat(elements.expectedReturn.value);
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
    const lumpsumAmount = parseInt(elements.lumpsumAmount.value);
    const years = parseInt(elements.period.value);
    const annualReturn = parseFloat(elements.expectedReturn.value);
    
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

// Event listeners
function setupEventListeners() {
    // Mode switching
    elements.investmentModeBtn.addEventListener('click', () => switchMode('investment'));
    elements.goalModeBtn.addEventListener('click', () => switchMode('goal'));
    
    // Slider inputs
    elements.lumpsumAmount.addEventListener('input', (e) => {
        elements.lumpsumAmountValue.textContent = formatNumber(e.target.value);
        performCalculations();
    });
    
    elements.goalAmount.addEventListener('input', (e) => {
        elements.goalAmountValue.textContent = formatCurrency(parseInt(e.target.value));
        performCalculations();
    });
    
    elements.period.addEventListener('input', (e) => {
        elements.periodValue.textContent = e.target.value;
        performCalculations();
    });
    
    elements.expectedReturn.addEventListener('input', (e) => {
        elements.returnValue.textContent = e.target.value;
        performCalculations();
    });
    
    elements.inflationRate.addEventListener('input', (e) => {
        elements.inflationValue.textContent = e.target.value;
        performCalculations();
    });
    
    elements.taxRate.addEventListener('input', (e) => {
        elements.taxValue.textContent = e.target.value;
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
    const presetButtons = document.querySelectorAll('.preset-btn');
    presetButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const amount = parseInt(e.target.getAttribute('data-amount'));
            elements.lumpsumAmount.value = amount;
            elements.lumpsumAmountValue.textContent = formatNumber(amount);
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
        elements.lumpsumAmount.value = scenario.amount;
        elements.lumpsumAmountValue.textContent = formatNumber(scenario.amount);
        elements.period.value = scenario.period;
        elements.periodValue.textContent = scenario.period;
        elements.expectedReturn.value = scenario.return;
        elements.returnValue.textContent = scenario.return;
        
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
    // Reset to default values
    elements.lumpsumAmount.value = defaultValues.lumpsumAmount;
    elements.lumpsumAmountValue.textContent = formatNumber(defaultValues.lumpsumAmount);
    elements.goalAmount.value = defaultValues.goalAmount;
    elements.goalAmountValue.textContent = formatCurrency(defaultValues.goalAmount);
    elements.period.value = defaultValues.investmentPeriod;
    elements.periodValue.textContent = defaultValues.investmentPeriod;
    elements.expectedReturn.value = defaultValues.expectedReturn;
    elements.returnValue.textContent = defaultValues.expectedReturn;
    elements.inflationRate.value = defaultValues.inflationRate;
    elements.inflationValue.textContent = defaultValues.inflationRate;
    elements.taxRate.value = defaultValues.taxRate;
    elements.taxValue.textContent = defaultValues.taxRate;
    elements.compoundingFreq.value = defaultValues.compoundingFrequency;
    
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
        formatCurrency(parseInt(elements.lumpsumAmount.value)) : 
        formatCurrency(parseInt(elements.goalAmount.value));
    
    alert(`Export functionality would generate a comprehensive PDF report with:
    
• ${mode} Mode Analysis
• Investment Amount: ${amount}
• Period: ${elements.period.value} years
• Expected Return: ${elements.expectedReturn.value}%
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