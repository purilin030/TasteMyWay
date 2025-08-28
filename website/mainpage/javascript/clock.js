const timeDisplay = document.getElementById('current-time');

function updateTime() {

    const now = new Date();

    const formattedTime = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12:true
    });

    timeDisplay.textContent = formattedTime;
}

updateTime();

setInterval(updateTime, 1000);
