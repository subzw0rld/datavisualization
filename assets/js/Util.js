var Util = {
    documentSelector: function(param) {
        return document.querySelector(param);
    },

    getRandom: function(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    getRandomUniqueValues: function(count, maxValue) {
        var arr = [];
        while(arr.length < count) {
            var randomNumber = Math.floor(Math.random()*maxValue) + 1;
            if(arr.indexOf(randomNumber) > -1) continue;
            arr[arr.length] = randomNumber;
        }
        return arr;
    }
}

var dataUtil = {
    getEmpByID: function (id, dataSource) {
        for (var i = 0; i < dataSource.length; i++) {
            var obj = dataSource[i];
            if (id === obj.empID) {
                return obj;
            }
        }
    }
}