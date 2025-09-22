function animateHeartPulse() {
    const heartIcon = document.querySelector('.chart-card h4:contains("❤️")');
    if (heartIcon) {
        heartIcon.style.animation = 'pulse 1s infinite';
    }
}

function animateVitalsEntry() {
    const chartCards = document.querySelectorAll('.chart-card');
    chartCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        setTimeout(() => {
            card.style.transition = 'all 0.6s ease-out';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 200);
    });
}

function animateStatusCards() {
    const statusCards = document.querySelectorAll('.status-card');
    statusCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'scale(0.8)';
        setTimeout(() => {
            card.style.transition = 'all 0.5s ease-out';
            card.style.opacity = '1';
            card.style.transform = 'scale(1)';
        }, index * 150);
    });
}

function animateAlertPulse() {
    const criticalAlert = document.getElementById('criticalAlert');
    if (criticalAlert && criticalAlert.classList.contains('critical')) {
        criticalAlert.style.animation = 'alertPulse 2s infinite';
    }
}

function animateDataStream() {
    const currentValues = document.querySelectorAll('.current-value');
    currentValues.forEach(value => {
        value.classList.add('data-stream');
    });
}

function animatePatientStatus(isOnline) {
    const statusElement = document.getElementById('patientOnlineStatus');
    if (statusElement) {
        if (isOnline) {
            statusElement.style.animation = 'fadeInGreen 1s ease-out';
        } else {
            statusElement.style.animation = 'fadeInRed 1s ease-out';
        }
    }
}

function animateChartUpdate(chart, newValue) {
    chart.data.datasets[0].data.push(newValue);
    if (chart.data.datasets[0].data.length > 15) {
        chart.data.datasets[0].data.shift();
    }
    
    chart.update({
        duration: 800,
        easing: 'easeOutQuart'
    });
}

function showLoadingAnimation() {
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loadingAnimation';
    loadingDiv.innerHTML = `
        <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                   background: rgba(255,255,255,0.9); padding: 20px; border-radius: 10px; 
                   box-shadow: 0 4px 20px rgba(0,0,0,0.2); z-index: 10000;">
            <div style="display: flex; align-items: center; gap: 15px;">
                <div class="loading-spinner"></div>
                <span style="color: #2c3e50; font-weight: 500;">Loading patient data...</span>
            </div>
        </div>
    `;
    document.body.appendChild(loadingDiv);
}

function hideLoadingAnimation() {
    const loadingDiv = document.getElementById('loadingAnimation');
    if (loadingDiv) {
        loadingDiv.remove();
    }
}

function triggerEmergencyAnimation() {
    const overlay = document.createElement('div');
    overlay.id = 'emergencyOverlay';
    overlay.style = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(231, 76, 60, 0.1);
        animation: emergencyFlash 0.5s infinite;
        z-index: 9999;
        pointer-events: none;
    `;
    document.body.appendChild(overlay);
    
    setTimeout(() => {
        overlay.remove();
    }, 3000);
}

function animateSidebar(sidebar, isOpening) {
    if (isOpening) {
        sidebar.style.transform = 'translateX(0)';
        sidebar.style.boxShadow = '4px 0 15px rgba(0,0,0,0.2)';
    } else {
        sidebar.style.transform = 'translateX(-100%)';
        sidebar.style.boxShadow = 'none';
    }
}

function injectAnimationStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }
        
        @keyframes alertPulse {
            0% { box-shadow: 0 0 0 0 rgba(231, 76, 60, 0.4); }
            70% { box-shadow: 0 0 0 10px rgba(231, 76, 60, 0); }
            100% { box-shadow: 0 0 0 0 rgba(231, 76, 60, 0); }
        }
        
        @keyframes fadeInGreen {
            from { opacity: 0; color: transparent; }
            to { opacity: 1; color: #27ae60; }
        }
        
        @keyframes fadeInRed {
            from { opacity: 0; color: transparent; }
            to { opacity: 1; color: #e74c3c; }
        }
        
        @keyframes emergencyFlash {
            0%, 100% { opacity: 0.1; }
            50% { opacity: 0.3; }
        }
        
        .loading-spinner {
            width: 24px;
            height: 24px;
            border: 3px solid #f3f3f3;
            border-top: 3px solid #3498db;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .data-stream {
            position: relative;
            overflow: hidden;
        }
        
        .data-stream::after {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
            animation: dataStream 1.5s infinite;
        }
        
        @keyframes dataStream {
            0% { left: -100%; }
            100% { left: 100%; }
        }
        
        .chart-card, .status-card, .alert-item, .action-btn {
            transition: all 0.3s ease;
        }
        
        .chart-card:hover, .status-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        }
        
        .action-btn:hover {
            transform: scale(1.05);
        }
    `;
    document.head.appendChild(style);
}

function initAnimations() {
    injectAnimationStyles();
    
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(() => {
            animateVitalsEntry();
            animateStatusCards();
            animateHeartPulse();
            animateDataStream();
        }, 500);
    });
}

window.HealthCareAnimations = {
    init: initAnimations,
    animateHeartPulse,
    animateVitalsEntry,
    animateStatusCards,
    animateAlertPulse,
    animateDataStream,
    animatePatientStatus,
    animateChartUpdate,
    showLoadingAnimation,
    hideLoadingAnimation,
    triggerEmergencyAnimation,
    animateSidebar
};