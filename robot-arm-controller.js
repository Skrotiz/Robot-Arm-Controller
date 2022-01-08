let gamepad;
const buttons = [];
const sliders = [];

const model = new Model();
const view = new View();
model.loggerCallback = view.log;

let nextServo = 0;
let nextMacro = 0;
let lastUpdate = Date.now();

window.addEventListener("gamepadconnected", ({gamepad}) => addGamepad(gamepad));
document.getElementById("file-selector").addEventListener('change', onLoadListener);
window.requestAnimationFrame(updateStatus);

function addGamepad(gamepad_) {
    gamepad = gamepad_;
    view.addGamepadCard(gamepad);
}

function updateStatus() {
    model.update(Date.now() - lastUpdate, gamepad);
    view.update(model.getServos());
    lastUpdate = Date.now();

    if (gamepad) {
        for (let i = 0; i < gamepad.buttons.length; i++) {
            let val = gamepad.buttons[i];
            buttons[i].className = "gamepad-button" + (val.pressed ? " pressed" : "");
        }

        for (let i = 0; i < gamepad.axes.length; i++) {
            sliders[i].value = gamepad.axes[i];
        }
    }

    window.requestAnimationFrame(updateStatus);
}

function addServoListener(savedData = null) {
    let servo;
    if (savedData === null) {
        servo = new Servo(nextServo++, 0);
    } else {
        servo = Servo.fromJSON(savedData);
        nextServo++;
    }
    view.addServoCard(servo,gamepad);
    model.addServo(servo);
}

function connectListener() {
    model.connect("localhost", "8765");
}

function onLoadListener(event) {
    model.clearServos();
    view.clearServos();
    nextServo = 0;

    const file = event.target.files[0];
    if (file.type !== "application/json") {
        alert("Must be a .json savefile!");
        return;
    }
    const reader = new FileReader();
    reader.addEventListener('loadend', _ => load(JSON.parse(reader.result.toString())));
    reader.readAsText(file);
}

function load(saveData) {
    saveData.forEach(servo => addServoListener(servo));
}

function saveListener() {
    download(JSON.stringify(model.getServos(), null, 4), "save.json", "application/json");
}

function download(data, filename, type) {
    const file = new Blob([data], {type: type});
    if (window.navigator.msSaveOrOpenBlob) // IE10+
        window.navigator.msSaveOrOpenBlob(file, filename);
    else { // Others
        const a = document.createElement("a"),
            url = URL.createObjectURL(file);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function () {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 0);
    }
}

function addMacro() {
    const macro = new Macro(`Macro ${nextMacro++}`);
    macro.actions.push(new Action(0, 0, 0));
    macro.actions.push(new Action(1, 255, 1000));
    macro.actions.push(new Action(0, 128, 0));
    macro.actions.push(new Action(1, 128, 1000));
    macro.actions.push(new Action(0, 255, 0));
    macro.actions.push(new Action(1, 120, 100));
    macro.actions.push(new Action(1, 110, 100));
    macro.actions.push(new Action(1, 100, 100));
    macro.actions.push(new Action(1, 90, 100));
    model.addMacro(macro);
    view.addMacro(macro);
}