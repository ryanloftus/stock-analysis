// TODO: add technical analysis + news tab content
// TODO: add prev. close as a horizontal line on the candle graph
// TODO: make candle graph smaller
// TODO: add company name + market below ticker

const Chart = require('./node_modules/chart.js');
const utils = require('./utils.js');

const url = 'https://finnhub.io/api/v1/';
const quoteParam = 'quote?symbol=';
const candleParam = 'stock/candle?symbol=';
const recommendationsParam = 'stock/recommendation?symbol=';
const apiKey = '&token=c41hlviad3ies3kt3gmg';

const ticker = document.getElementById('input-ticker');
const candleGraph = makeCandleGraph();
const recommendationGraph = makeRecommendationGraph();
const tablinks = Array.from(document.getElementsByClassName('tablinks'));

function makeCandleGraph() {
    return new Chart(document.getElementById('candle-graph'), {
        data: {
            labels: [], 
            datasets: [{type: 'line', label: 'Price', yAxisID: 'p', data: [], borderColor: '#2779e6'}, 
                       {type: 'bar', label: 'Volume (thousands)', yAxisID: 'v', data: []}]
        },
        options: {
            responsive: true,
            scales: {
                p: {type: 'linear', position: 'left', title: {text: 'Price', display: true}},
                v: {type: 'linear', position: 'right', title: {text: 'Volume (thousands)', display: true}, grid: {display: false}}
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

function makeRecommendationGraph() {
    return new Chart(document.getElementById('recommendation-graph'), {
        type: 'bar',
        data: {
            labels: [], 
            datasets: [{label: 'This Month', data: [], backgroundColor: '#2779e6'},
                       {label: 'Last Month', data: [], backgroundColor: '#e99921'}]
        },
        options: {
            responsive: true,
            interaction: {intersect: false, mode: 'index'},
            scales: {y: {beginAtZero: true, title: {text: '# of Analysts', display: true}}}
        }
    });
}

function setQuoteVal(element, val, exchangeRate, isChange) {
    element.innerHTML = exchangeRate ? utils.getDollarVal(val, exchangeRate) : utils.getPercentVal(val);
    if (isChange) {
        if (val > 0) {
            element.setAttribute('class', 'up');
        } else if (val < 0) {
            element.setAttribute('class', 'down');
        }
    }
}

function renderQuote(quote, exchangeRate) {
    const arrow = document.getElementById('change-arrow');
    if (quote.d > 0) {
        arrow.className = 'material-icons up';
        arrow.innerHTML = 'trending_up';
    } else if (quote.d < 0) {
        arrow.className = 'material-icons down';
        arrow.innerHTML = 'trending_down';
    } else {
        arrow.className = '';
        arrow.innerHTML = '';
    }
    setQuoteVal(document.getElementById('current'), quote.c, exchangeRate, false);
    setQuoteVal(document.getElementById('change'), quote.d, exchangeRate, true);
    setQuoteVal(document.getElementById('percent-change'), quote.dp, false, true);
    setQuoteVal(document.getElementById('high'), quote.h, exchangeRate, false);
    setQuoteVal(document.getElementById('low'), quote.l, exchangeRate, false);
    setQuoteVal(document.getElementById('open'), quote.o, exchangeRate, false);
    setQuoteVal(document.getElementById('close'), quote.pc, exchangeRate, false);
    document.getElementById('display-currency').innerHTML = document.getElementById('currency').value;
}

function renderCandle(candle, exchangeRate) {
    if (candle.s === 'ok') {
        candleGraph.data.labels = utils.getReadableDates(candle.t);
        candleGraph.data.datasets[0].data = candle.c.map(val => utils.getDollarVal(val, exchangeRate));
        candleGraph.data.datasets[1].data = candle.v.map(val => val / 1000);
        candleGraph.update();
    }
}

function renderRecommendationTrends(recommendationTrends) {
    const history = Math.min(recommendationTrends.length, 2);
    recommendationGraph.data.labels = ['Strong Sell', 'Sell', 'Hold', 'Buy', 'Strong Buy'];
    for (let i = 0; i < history; i++) {
        const data = recommendationTrends[i];
        recommendationGraph.data.datasets[i].data = [data.strongSell, data.sell, data.hold, data.buy, data.strongBuy];
    }
    recommendationGraph.update();
}

async function displayStockData() {
    if (ticker.value) {
        const capitalizedTicker = ticker.value.toUpperCase();
        const exchangeRates = await utils.getData('forex', capitalizedTicker);
        const quote = await utils.getData('quote', capitalizedTicker);
        if (quote) {
            const candle = await utils.getData('candle', capitalizedTicker);
            const exchangeRate = exchangeRates.quote[document.getElementById('currency').value];
            renderQuote(quote, exchangeRate);
            renderCandle(candle, exchangeRate);
            document.getElementById('display-ticker').innerHTML = capitalizedTicker;
            const recommendationTrends = await utils.getData('recommendations', capitalizedTicker);
            renderRecommendationTrends(recommendationTrends);
        }
    }
}

function changeTab(newTab) {
    tablinks.forEach(element => {
        if (!document.getElementById(element.value).hasAttribute('hidden')) {
            element.className = element.className.replace(' active', '');
            document.getElementById(element.value).setAttribute('hidden', 'hidden');
        }
    });
    newTab.className += ' active';
    document.getElementById(newTab.value).removeAttribute('hidden');
}

ticker.onkeydown = event => {
    if (event.code === 'Enter') {
        displayStockData()
    }
};
document.getElementById('search').onclick = displayStockData;
tablinks.forEach(element => element.onclick = event => changeTab(event.currentTarget));
document.getElementsByName('date-range').forEach(element => element.onchange = displayStockData);
document.getElementById('settings').onclick = function() {
    document.getElementById('settings-window').removeAttribute('hidden');
};
document.getElementById('close-settings').onclick = function () {
    document.getElementById('settings-window').setAttribute('hidden', 'hidden');
};