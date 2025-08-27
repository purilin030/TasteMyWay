const timeDisplay = document.getElementById('current-time');

function updateTime() {

    const now = new Date();

    const formattedTime = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12:true
    });

    // 将格式化后的时间设置到 span 元素中
    timeDisplay.textContent = formattedTime;
}

// 首次加载页面时立即更新时间
updateTime();

// 每秒钟更新一次时间，以保持准确性
setInterval(updateTime, 1000);