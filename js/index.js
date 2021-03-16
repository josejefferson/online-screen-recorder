if (window.location.hostname !== 'localhost' &&
	window.location.hostname !== '127.0.0.1' &&
	window.location.protocol === 'http:') {
	window.location.protocol = 'https:'
}

var recording, stream, paused = false, timer, defaultTitle = document.title
const $output = document.getElementById('voutput')
const $width = document.getElementById('vwidth')
const $height = document.getElementById('vheight')
const $framerate = document.getElementById('vframerate')
const $delay = document.getElementById('vdelay')
const $start = document.getElementById('vstart')
const $pause = document.getElementById('vpause')
const $stop = document.getElementById('vstop')
const $download = document.getElementById('vdownload')
const $timer = document.getElementById('vtimer')

$output.style.display = 'none'
$pause.style.display = 'none'
$stop.style.display = 'none'
$download.style.display = 'none'

$start.onclick = startCapturing
$pause.onclick = pauseCapturing
$stop.onclick = stopCapturing
$download.onclick = downloadRecording

if (!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia)) {
	$timer.innerHTML = 'Your browser does not support screen capture!'
	$width.disabled = true
	$height.disabled = true
	$framerate.disabled = true
	$delay.disabled = true
	$start.disabled = true
}

function startScreenCapture() {
	return navigator.mediaDevices.getDisplayMedia({
		video: {
			width: $width.value,
			height: $height.value,
			frameRate: $framerate.value
		},
		audio: true
	})
}

async function startCapturing() {
	window.URL.revokeObjectURL(recording)
	chunks = []
	stream = await startScreenCapture().catch(() => { })
	if (!stream) return
	$start.style.display = 'none'
	$pause.disabled = true
	$stop.disabled = true
	$output.style.display = 'none'
	$pause.style.display = 'inline-block'
	$stop.style.display = 'inline-block'
	$download.style.display = 'none'

	stream.addEventListener('inactive', stopCapturing)
	mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' })
	mediaRecorder.addEventListener('dataavailable', event => {
		if (event.data && event.data.size > 0) {
			chunks.push(event.data)
		}
	})
	timer = new Stopwatch(null, 1000, false)
	timer.setElapsed(null, null, parseInt($delay.value))
	timer.setListener(timer => {
		$timer.innerHTML = 'Starting at: ' + timer.toString()
		document.title = `(-${timer.toString()}) ${defaultTitle}`
	})
	timer.start()
	$timer.innerHTML = 'Starting at: ' + timer.toString()
	document.title = `(-${timer.toString()}) ${defaultTitle}`

	setTimeout(() => {
		timer.stop()
		mediaRecorder.start(10)
		$pause.disabled = false
		$stop.disabled = false

		timer = new Stopwatch(null, 1000)
		timer.setListener(timer => {
			$timer.innerHTML = timer.toString()
			document.title = `(${timer.toString()}) ${defaultTitle}`
		})
		timer.start()
		$timer.innerHTML = timer.toString()
		document.title = `(${timer.toString()}) ${defaultTitle}`
	}, $delay.value * 1000)
}

function pauseCapturing() {
	if (paused) {
		$pause.children[0].classList.remove('mdi-play')
		$pause.children[0].classList.add('mdi-pause')
		document.title = `(${timer.toString()}) ${defaultTitle}`
		mediaRecorder.resume()
		timer.start()
		paused = false
	} else {
		$pause.children[0].classList.remove('mdi-pause')
		$pause.children[0].classList.add('mdi-play')
		document.title = `(⏸ ${timer.toString()}) ${defaultTitle}`
		mediaRecorder.pause()
		timer.stop()
		paused = true
	}
}

function stopCapturing() {
	$start.style.display = 'inline-block'
	$pause.style.display = 'none'
	$stop.style.display = 'none'
	$download.style.display = 'inline-block'
	$output.style.display = 'block'
	timer.stop()
	document.title = defaultTitle
	$pause.children[0].classList.remove('mdi-play')
	$pause.children[0].classList.add('mdi-pause')
	paused = false

	stream.removeEventListener('inactive', stopCapturing)
	mediaRecorder.stop()
	stream.getTracks().forEach(track => track.stop())
	stream = undefined
	const blob = new Blob(chunks, { type: 'video/webm' })
	ysFixWebmDuration(blob, timer.totalElapsed, blob => {
		recording = window.URL.createObjectURL(blob)
		$output.src = recording
	})
}

function downloadRecording() {
	const downloadLink = document.createElement('a')
	downloadLink.href = recording
	downloadLink.download = `screen-recording-${Date.now()}.webm`
	downloadLink.style.display = 'none'
	document.body.appendChild(downloadLink)
	downloadLink.click()
}

if ('serviceWorker' in navigator) {
	navigator.serviceWorker.register('sw.js')
}