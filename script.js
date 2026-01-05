const wheel = document.getElementById('wheel');
const spinBtn = document.getElementById('spin-btn');
const namesArea = document.getElementById('names-area');
// const updateBtn = document.getElementById('update-btn'); // Removed
const clearBtn = document.getElementById('clear-btn');
const shuffleBtn = document.getElementById('shuffle-btn');
const modal = document.getElementById('modal');
const winnerName = document.getElementById('winner-name');
const closeModal = document.getElementById('close-modal');
const removeWinnerBtn = document.getElementById('remove-winner');
const selectedNameDiv = document.getElementById('selected-name');

// Initial Data
let participants = ['Nome', 'Nome', 'Nome', 'Nome', 'Nome', 'Nome'];
let colors = [
    '#FF0055', '#00DDFF', '#FFD700', '#A020F0', '#32CD32',
    '#FF8C00', '#00FA9A', '#FF1493', '#4169E1', '#FF4500',
    '#9400D3', '#00FFFF', '#ADFF2F', '#DC143C', '#7B68EE',
    '#FF6347', '#40E0D0', '#EE82EE', '#FFFF00', '#8A2BE2',
    '#FF00FF', '#7FFF00', '#D2691E', '#1E90FF', '#FA8072',
    '#FF69B4', '#3CB371', '#9370DB', '#FFA500', '#00BFFF'
];

// Victory Sound using Web Audio API (no external files needed)
function playVictorySound() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const now = audioContext.currentTime;

    // Create oscillator for the sound
    const osc = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    osc.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Victory fanfare pattern (ascending notes)
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.setValueAtTime(659.25, now + 0.15); // E5
    osc.frequency.setValueAtTime(783.99, now + 0.3); // G5
    osc.frequency.setValueAtTime(1046.50, now + 0.45); // C6

    // Volume envelope
    gainNode.gain.setValueAtTime(0.3, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.8);

    osc.type = 'sine';
    osc.start(now);
    osc.stop(now + 0.8);
}

// Text-to-Speech for winner name
function speakWinnerName(name) {
    if ('speechSynthesis' in window) {
        const announcement = `Vencedor é ${name} Parabéns!`;
        const utterance = new SpeechSynthesisUtterance(announcement);
        utterance.lang = 'pt-BR'; // Portuguese
        utterance.rate = 0.9; // Slightly slower for clarity
        utterance.pitch = 1.2; // Slightly higher pitch for excitement
        utterance.volume = 1.0;

        // Wait a moment before speaking
        setTimeout(() => {
            speechSynthesis.speak(utterance);
        }, 500);
    }
}

let isSpinning = false;
let currentRotation = 0;
let lastWinner = null; // Track the last winner to remove from list

// Initialize
function init() {
    namesArea.value = participants.join('\n');
    drawWheel();
}

// Draw Wheel
function drawWheel() {
    if (participants.length === 0) {
        wheel.style.background = '#333';
        wheel.innerHTML = '';
        return;
    }

    const segmentSize = 360 / participants.length;
    let gradientParts = [];

    participants.forEach((p, index) => {
        const color = colors[index % colors.length];
        const start = index * segmentSize;
        const end = (index + 1) * segmentSize;
        gradientParts.push(`${color} ${start}deg ${end}deg`);
    });

    wheel.style.background = `conic-gradient(${gradientParts.join(', ')})`;

    // Clear previous numbers/text
    wheel.innerHTML = '';

    // Add text labels
    participants.forEach((p, index) => {
        const segment = document.createElement('div');
        segment.style.position = 'absolute';
        segment.style.top = '0';
        segment.style.left = '50%';
        segment.style.width = '2px';
        segment.style.height = '50%';
        segment.style.transformOrigin = 'bottom';
        const angle = (index * segmentSize) + (segmentSize / 2);
        segment.style.transform = `translateX(-50%) rotate(${angle}deg)`;

        const text = document.createElement('span');
        text.innerText = p;
        text.style.position = 'absolute';
        text.style.top = '20px';
        text.style.left = '50%';
        text.style.transform = 'translateX(-50%)';
        text.style.color = '#fff';
        text.style.fontWeight = 'bold';
        text.style.fontSize = Math.max(12, 18 - (participants.length * 0.2)) + 'px'; // Dynamic scaling
        text.style.textShadow = '0 0 4px rgba(0,0,0,0.8)';

        // Truncate long names
        if (p.length > 15) {
            text.innerText = p.substring(0, 12) + '...';
        }

        segment.appendChild(text);
        wheel.appendChild(segment);
    });
}

// Update Participants from Text Area
function updateParticipants() {
    const text = namesArea.value;
    const lines = text.split(/\r?\n/);

    participants = lines.map(line => line.trim()).filter(line => line.length > 0);

    drawWheel();
}

// Shuffle Participants (Fun Utility)
function shuffleParticipants() {
    participants.sort(() => Math.random() - 0.5);
    namesArea.value = participants.join('\n');
    drawWheel();
}

// Spin Logic
function spin() {
    if (participants.length === 0) return;

    namesArea.disabled = true;

    const extraSpins = 5 + Math.random() * 5;
    const randomDegree = Math.floor(extraSpins * 360) + Math.floor(Math.random() * 360);

    currentRotation += randomDegree;

    wheel.style.transform = `rotate(${currentRotation}deg)`;

    setTimeout(() => {
        // Calculate which segment is under the arrow
        const finalRotation = currentRotation % 360;
        const segmentSize = 360 / participants.length;

        // Arrow is at Left (270 degrees). Wheel rotates clockwise.
        // Need to find which segment ended up at 270 degrees
        const adjustedAngle = (270 - finalRotation + 360) % 360;
        const winningIndex = Math.floor(adjustedAngle / segmentSize) % participants.length;

        const selectedName = participants[winningIndex];
        console.log(`Rotation: ${finalRotation.toFixed(1)}°, Index: ${winningIndex}, Name: ${selectedName}`);

        // Show name indicator briefly
        selectedNameDiv.textContent = selectedName;
        selectedNameDiv.style.display = 'block';

        setTimeout(() => {
            selectedNameDiv.style.display = 'none';
            showWinner(selectedName);
        }, 1000);

        namesArea.disabled = false;
    }, 4000);
}

function showWinner(name) {
    winnerName.innerText = name;
    modal.classList.remove('hidden');

    confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
    });

    // Play victory sound
    try {
        playVictorySound();
    } catch (e) {
        console.log('Sound failed:', e);
    }

    // Speak the winner's name
    speakWinnerName(name);

    // Store the winner name for removal later
    lastWinner = name;
}

// Event Listeners
// Real-time updates
namesArea.addEventListener('input', updateParticipants);

clearBtn.addEventListener('click', () => {
    participants = [];
    namesArea.value = '';
    drawWheel();
});

shuffleBtn.addEventListener('click', shuffleParticipants);

spinBtn.addEventListener('click', spin);

closeModal.addEventListener('click', () => {
    modal.classList.add('hidden');
    lastWinner = null; // Clear without removing from list
});

removeWinnerBtn.addEventListener('click', () => {
    modal.classList.add('hidden');

    // Remove the winner from the list
    if (lastWinner) {
        const index = participants.indexOf(lastWinner);
        if (index > -1) {
            participants.splice(index, 1);
            namesArea.value = participants.join('\n');
            drawWheel();
        }
        lastWinner = null;
    }
});

// Start
init();
