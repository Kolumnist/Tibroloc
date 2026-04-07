const MAIN_BUTTON_NAMES = ["RESUME", "PAUSE"];

var _startDiv = document.getElementById("startDiv");
var _mainDiv = document.getElementById("mainDiv");
var _mainButton = document.getElementsByName("mainButton")[0];
var _time = document.getElementById("time");

var _tableBody = document.getElementById("tableBody");
var _fullIncome = document.getElementById("fullIncome");

let intervalId = null;
let fileHandle = null;

let startTimeInSeconds = 0;
let stopTimeInSeconds = 0;
let currentTimeInSeconds = 0;
let startDate = null;

let incomePerHour = 18;

async function getJsonFile() {
    [fileHandle] = await window.showOpenFilePicker();
    let file = await fileHandle.getFile();
    let content = await file.text();
    
    const data = JSON.parse(content);
    //console.log(data[0].startDate);
    return data;
}

async function onclickInit() {
    try {
        const data = await getJsonFile();
        let fullIncome = 0;
        let tableBodyContentString = "";
        for (let i = 0; i < data.length; i++) {
            fullIncome += data[i].income;
            tableBodyContentString = tableBodyContentString.concat(
                `<tr>
                    <td>${data[i].startDate}</td>
                    <td>${data[i].endDate}</td>
                    <td>${data[i].time}</td>
                    <td>${data[i].income}</td>
                </tr>`
            ); // MAYBE make the time only show hours and minutes cause that seems more plausible
        }
        _fullIncome.innerText = fullIncome+"\u20ac";
        _tableBody.innerHTML = tableBodyContentString;

        _startDiv.hidden = true;
        _mainDiv.hidden = false;

        startDate = new Date().toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
        });
        startTimeInSeconds = parseInt(new Date().getTime() / 1000);
        intervalId ??= setInterval(setTime, 500);
    } catch (e) {
        console.warn("User cancel or file error", e);
    }
}

function formatTime() {
    let hours = parseInt(currentTimeInSeconds / 3600).toString().padStart(2, '0');
    let minutes = parseInt((currentTimeInSeconds / 60) % 60).toString().padStart(2, '0');
    let seconds = parseInt(currentTimeInSeconds % 60).toString().padStart(2, '0');

    return `${hours}:${minutes}:${seconds}`;
}

function setTime() {
    currentTimeInSeconds = new Date().getTime() / 1000 - startTimeInSeconds;
    _time.textContent = formatTime();
}

function onclickToggle() {
    if (intervalId != null) {
        clearInterval(intervalId);
        intervalId = null;
        stopTimeInSeconds = new Date().getTime() / 1000;

        _mainButton.textContent = MAIN_BUTTON_NAMES[0];
    } else {
        intervalId ??= setInterval(setTime, 500);
        _mainButton.textContent = MAIN_BUTTON_NAMES[1];
        startTimeInSeconds += parseInt((new Date().getTime() / 1000) - stopTimeInSeconds);
    }
}

async function onclickSave() {
    let endDateString = new Date().toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
    });
    let timeString = formatTime();
    let income = parseInt(incomePerHour * currentTimeInSeconds / 3600);

    try {
        let file = await fileHandle.getFile();
        let content = await file.text();
        let jsonObject = JSON.parse(content);
        jsonObject.push({startDate: startDate, endDate: endDateString, time: timeString, income: income});

        let writable = await fileHandle.createWritable();
        await writable.write(JSON.stringify(jsonObject, null, 2))
        await writable.close().then(() => {
            window.location.reload();
        });
    } catch (e) {
        console.error("Cannot find file", e);
    }
}
