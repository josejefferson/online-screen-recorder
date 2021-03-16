if (window.location.hostname != 'localhost' && window.location.hostname != '127.0.0.1' && window.location.protocol == 'http:') {
	window.location.protocol = 'https:'
}

var recording, paused = false, timer, defaultTitle = document.title
var voutputEl = document.getElementById('voutput')
var vwidthEl = document.getElementById('vwidth')
var vheightEl = document.getElementById('vheight')
var vframerateEl = document.getElementById('vframerate')
var vdelayEl = document.getElementById('vdelay')
var vstartEl = document.getElementById('vstart')
var vpauseEl = document.getElementById('vpause')
var vstopEl = document.getElementById('vstop')
var vdownloadEl = document.getElementById('vdownload')
var vtimerEl = document.getElementById('vtimer')

voutputEl.style.display = 'none'
vpauseEl.style.display = 'none'
vstopEl.style.display = 'none'
vdownloadEl.style.display = 'none'

vstartEl.onclick = startCapturing
vpauseEl.onclick = pauseCapturing
vstopEl.onclick = stopCapturing
vdownloadEl.onclick = downloadRecording

if (!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia)) {
	vtimerEl.innerHTML = 'Your browser does not support screen capture!'
	vwidthEl.disabled = true
	vheightEl.disabled = true
	vframerateEl.disabled = true
	vdelayEl.disabled = true
	vstartEl.disabled = true
}

function startScreenCapture() {
	return navigator.mediaDevices.getDisplayMedia({
		video: {
			width: vwidthEl.value,
			height: vheightEl.value,
			frameRate: vframerateEl.value
		},
		audio: true
	})
}

async function startCapturing() {
	window.URL.revokeObjectURL(recording)
	chunks = []
	stream = await startScreenCapture()
	vstartEl.style.display = 'none'
	vpauseEl.disabled = true
	vstopEl.disabled = true
	voutputEl.style.display = 'none'
	vpauseEl.style.display = 'inline-block'
	vstopEl.style.display = 'inline-block'
	vdownloadEl.style.display = 'none'

	stream.addEventListener('inactive', stopCapturing)
	mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' })
	mediaRecorder.addEventListener('dataavailable', event => {
		if (event.data && event.data.size > 0) {
			chunks.push(event.data)
		}
	})
	timer = new Stopwatch(null, 1000, false)
	timer.setElapsed(null, null, parseInt(vdelayEl.value))
	timer.setListener(timer => {
		vtimerEl.innerHTML = 'Starting at: ' + timer.toString()
		document.title = `(-${timer.toString()}) ${defaultTitle}`
	})
	timer.start()
	vtimerEl.innerHTML = 'Starting at: ' + timer.toString()
	document.title = `(-${timer.toString()}) ${defaultTitle}`

	setTimeout(() => {
		timer.stop()
		mediaRecorder.start(10)
		vpauseEl.disabled = false
		vstopEl.disabled = false

		timer = new Stopwatch(null, 1000)
		timer.setListener(timer => {
			vtimerEl.innerHTML = timer.toString()
			document.title = `(${timer.toString()}) ${defaultTitle}`
		})
		timer.start()
		vtimerEl.innerHTML = timer.toString()
		document.title = `(${timer.toString()}) ${defaultTitle}`
	}, vdelayEl.value * 1000)
}

function pauseCapturing() {
	if (paused) {
		vpauseEl.children[0].classList.remove('mdi-play')
		vpauseEl.children[0].classList.add('mdi-pause')
		document.title = `(${timer.toString()}) ${defaultTitle}`
		mediaRecorder.resume()
		timer.start()
		paused = false
	} else {
		vpauseEl.children[0].classList.remove('mdi-pause')
		vpauseEl.children[0].classList.add('mdi-play')
		document.title = `(⏸ ${timer.toString()}) ${defaultTitle}`
		mediaRecorder.pause()
		timer.stop()
		paused = true
	}
}

function stopCapturing() {
	vstartEl.style.display = 'inline-block'
	vpauseEl.style.display = 'none'
	vstopEl.style.display = 'none'
	vdownloadEl.style.display = 'inline-block'
	voutputEl.style.display = 'block'
	timer.stop()
	document.title = defaultTitle
	vpauseEl.children[0].classList.remove('mdi-play')
	vpauseEl.children[0].classList.add('mdi-pause')
	paused = false

	stream.removeEventListener('inactive', stopCapturing)
	mediaRecorder.stop()
	stream.getTracks().forEach(track => track.stop())
	const blob = new Blob(chunks, { type: 'video/webm' })
	ysFixWebmDuration(blob, timer.totalElapsed, blob => {
		recording = window.URL.createObjectURL(blob)
		voutputEl.src = recording
	})
}

function downloadRecording() {
	const downloadLink = document.createElement('a')
	downloadLink.href = recording
	downloadLink.download = 'screen-recording.webm'
	downloadLink.style.display = 'none'
	document.body.appendChild(downloadLink)
	downloadLink.click()
}