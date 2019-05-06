var topBilledChartData = {
    labels: ["Release 4.1", "Release 4.2", "HFS", "NACM", "TOC"],
    datasets: [{
        label: 'Revenue in Millions',
        data: [1, 0.5, 3, 0.25, 2.1],
        backgroundColor: ['rgba(236, 0, 140, 0.9)', 'rgba(236, 0, 140, 0.9)', 'rgba(236, 0, 140, 0.9)', 'rgba(236, 0, 140, 0.9)', 'rgba(236, 0, 140, 0.9)']
    }]
};

// Chart.defaults.global.defaultFontColor='white';
var topBilledContext = Util.documentSelector("#projectTopBilled > canvas").getContext('2d');
var topBilledChart = new Chart(topBilledContext, {
    type: 'bar',
    data: topBilledChartData
});

var projectStatusData = {
    labels: ["Release 4.1", "Release 4.2", "HFS", "NACM", "TOC"],
    datasets: [{
        label: 'Release 4.1 %',
        data: [10, 40, 55, 1, 100],
        backgroundColor: ['rgba(236, 0, 140, 0.9)', 'rgba(87, 202, 244, 0.9)', 'rgba(118, 201, 0, 0.9)', 'rgba(236, 0, 140, 0.9)', 'rgba(236, 0, 140, 0.9)']
    },
    {
        label: 'Release 4.2 %',
        data: [20, 35, 58, 82, 50],
        backgroundColor: 'rgba(87, 202, 244, 0.9)'
    },
    {
        label: 'HFS %',
        data: [5, 30, 58, 74, 100],
        backgroundColor: 'rgba(118, 201, 0, 0.9)'
    },
    {
        label: 'NACM %',
        data: [20, 22, 15, 13, 47],
        backgroundColor: 'rgba(241,196,15, 0.9)'
    },
    {
        label: 'TOC %',
        data: [20, 35, 58, 82, 50],
        backgroundColor: 'rgba(10,64,105, 0.9)'
    }
]
};
var projectStatusContext = Util.documentSelector("#projectStatus > canvas").getContext('2d');
var projectStatusChart = new Chart(projectStatusContext, {
    type: 'radar',
    data: projectStatusData
});