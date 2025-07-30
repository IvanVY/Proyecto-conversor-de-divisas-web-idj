document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const amountInput = document.getElementById('amount');
    const fromCurrencySelect = document.getElementById('from-currency');
    const toCurrencySelect = document.getElementById('to-currency');
    const swapBtn = document.getElementById('swap-currencies');
    const convertBtn = document.getElementById('convert');
    const resultContainer = document.getElementById('result');
    const conversionResult = document.getElementById('conversion-result');
    const rateInfo = document.getElementById('rate-info');
    const lastUpdate = document.getElementById('last-update');
    const errorMessage = document.getElementById('error');

    // Variables de estado
    let conversionRate = 0;
    let lastUpdated = '';

    // Event Listeners
    convertBtn.addEventListener('click', convertCurrency);
    swapBtn.addEventListener('click', swapCurrencies);
    amountInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            convertCurrency();
        }
    });

    // Función principal de conversión
    async function convertCurrency() {
        const amount = parseFloat(amountInput.value);
        const fromCurrency = fromCurrencySelect.value;
        const toCurrency = toCurrencySelect.value;

        // Validación
        if (isNaN(amount) || amount <= 0) {
            showError("Por favor ingrese una cantidad válida mayor a cero");
            return;
        }

        try {
            // Mostrar estado de carga
            setLoadingState(true);

            // Ocultar resultados y errores anteriores
            hideResult();
            hideError();

            // Obtener tasa de conversión
            const result = await fetchConversionRate(fromCurrency, toCurrency, amount);

            // Mostrar resultados
            displayConversionResult(amount, fromCurrency, result.conversionResult, toCurrency, result.rate);
            displayRateInfo(fromCurrency, toCurrency, result.rate);
            displayLastUpdated(result.timeLastUpdate);
            
            // Guardar datos para posible uso futuro
            conversionRate = result.rate;
            lastUpdated = result.timeLastUpdate;

        } catch (error) {
            console.error("Error en la conversión:", error);
            showError("Error al obtener tasas de cambio. Intente nuevamente.");
        } finally {
            setLoadingState(false);
        }
    }

    // Función para obtener tasas de la API
    async function fetchConversionRate(from, to, amount) {
        
        const apiKey = import.meta.env.VITE_API_KEY;
        const url = `https://v6.exchangerate-api.com/v6/${apiKey}/pair/${from}/${to}/${amount}`;

        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();

        if (data.result === 'error') {
            throw new Error(data['error-type']);
        }

        return {
            conversionResult: data.conversion_result,
            rate: data.conversion_rate,
            timeLastUpdate: new Date(data.time_last_update_utc).toLocaleString()
        };
    }

    // Función para intercambiar divisas
    function swapCurrencies() {
        const temp = fromCurrencySelect.value;
        fromCurrencySelect.value = toCurrencySelect.value;
        toCurrencySelect.value = temp;
        
        // Si ya hay un resultado, convertir automáticamente
        if (resultContainer.style.display === 'block') {
            convertCurrency();
        }
    }

    // Mostrar resultado de la conversión
    function displayConversionResult(amount, from, result, to, rate) {
        conversionResult.textContent = `${formatNumber(amount)} ${from} = ${formatNumber(result)} ${to}`;
        resultContainer.classList.add('show');
    }

    // Mostrar información de la tasa
    function displayRateInfo(from, to, rate) {
        rateInfo.textContent = `1 ${from} = ${formatNumber(rate, 6)} ${to}`;
    }

    // Mostrar última actualización
    function displayLastUpdated(time) {
        lastUpdate.textContent = `Actualizado: ${time}`;
    }

    // Formatear números
    function formatNumber(num, decimals = 2) {
        return new Intl.NumberFormat('es-ES', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(num);
    }

    // Mostrar error
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
    }

    // Ocultar error
    function hideError() {
        errorMessage.style.display = 'none';
    }

    // Ocultar resultado
    function hideResult() {
        resultContainer.classList.remove('show');
    }

    // Estado de carga
    function setLoadingState(isLoading) {
        if (isLoading) {
            convertBtn.disabled = true;
            convertBtn.innerHTML = '<div class="loader"></div> Procesando...';
        } else {
            convertBtn.disabled = false;
            convertBtn.innerHTML = '<span>Convertir</span>';
        }
    }

    // Cargar monedas más populares primero
    function prioritizePopularCurrencies() {
        const popularCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'MXN', 'BRL', 'ARS', 'COP'];
        
        sortSelectOptions(fromCurrencySelect, popularCurrencies);
        sortSelectOptions(toCurrencySelect, popularCurrencies);
        
        // Establecer EUR como destino por defecto
        toCurrencySelect.value = 'EUR';
    }

    // Ordenar opciones del select
    function sortSelectOptions(selectElement, priorityOrder) {
        const options = Array.from(selectElement.options);
        
        options.sort((a, b) => {
            const aIndex = priorityOrder.indexOf(a.value);
            const bIndex = priorityOrder.indexOf(b.value);
            
            if (aIndex === -1) return 1;
            if (bIndex === -1) return -1;
            return aIndex - bIndex;
        });

        // Limpiar y reordenar opciones
        selectElement.innerHTML = '';
        options.forEach(option => {
            selectElement.appendChild(option);
        });
    }

    // Inicializar
    prioritizePopularCurrencies();
});