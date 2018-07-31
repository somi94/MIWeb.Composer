<?php
$file = $_SERVER['REQUEST_URI'];
$file = explode('/',$file);
$file = $file[count($file) - 1];

$config = preg_replace('/\.[\w\d]+$/','', $file);
$config = ltrim($config,"/");
$config = str_replace(' ','+',$config);
$config = base64_decode($config);
$config = json_decode($config, true);

function packv($c, $v) {
	return [
		[$v, $v >> 8], 
		[$v, $v >> 8, $v >> 16, $v >> 24]
	][$c];
}

function get_curve_frame($curve, $f) {
	$frames = $curve['frames'];
	$frameCount = count($frames);
	$l = $curve['end'] ? floor($f / $frameCount) : 0;
	$loopX = $frames[$frameCount - 1]['point']['x'];
	$flipX = ($curve['end'] == 'ping-pong-x' && $l % 2 == 1) || ($curve['end'] == 'ping-pong-xy' && $l % 2 == 1);
	$flipY = ($curve['end'] == 'ping-pong-y' && $l % 2 == 1) || ($curve['end'] == 'ping-pong-xy' && $l % 4 > 1);
	
	$index = $f;
	$index = $curve['end'] ? $index - $l * $frameCount : ($index >= $frameCount ? $frameCount - 1 : $index);
	$index = $flipX ? $frameCount - 1 - $index : $index;
	
	return [
		'point' => [
			'x' => $flipX ? $loopX * ($l + 1) - $frames[$index]['point']['x'] : $frames[$index]['point']['x'] + $loopX * $l,
			'y' => $frames[$index]['point']['y'] * ($flipY ? -1 : 1)
		],
		'controlLeft' => $flipX ? [
			'x' => $frames[$index]['controlRight']['x'] * -1,
			'y' => $frames[$index]['controlRight']['y'] * ($flipY ? -1 : 1)
		] : [
			'x' => $frames[$index]['controlLeft']['x'],
			'y' => $frames[$index]['controlLeft']['y'] * ($flipY ? -1 : 1)
		],
		'controlRight' => $flipX ? [
			'x' => $frames[$index]['controlLeft']['x'] * -1,
			'y' => $frames[$index]['controlLeft']['y'] * ($flipY ? -1 : 1)
		] : [
			'x' => $frames[$index]['controlRight']['x'],
			'y' => $frames[$index]['controlRight']['y'] * ($flipY ? -1 : 1)
		],
		'virtual' => $f >= $frameCount
	];
}

function get_curve_value($curve, $x) {
	$p = [];
	$px = 0;
	$tx = 0;
	$frameCount = count($curve['frames']);
	$curveLength = $curve['frames'][$frameCount - 1]['point']['x'];
	$curveNum = floor($x / $curveLength);
	
	for($f = 0; $f < $frameCount; $f++) {
		$frame = get_curve_frame($curveNum * $frameCount + $f);
		$nextFrame = get_curve_frame($curveNum * $frameCount + $f + 1);
		if($frame['point']['x'] <= $x && $nextFrame['point']['x'] >= $x) {
			$p = [
				$frame['point'],
				['x' => $frame['point']['x'] + $frame['controlRight']['x'], 'y' => $frame['point']['y'] + $frame['controlRight']['y']],
				['x' => $nextFrame['point']['x'] + $nextFrame['controlLeft']['x'], 'y' => $nextFrame['point']['y'] + $nextFrame['controlLeft']['y']],
				$nextFrame['point']
			];
			$px = $x - $frame['point']['x'];
			$tx = $px / ($nextFrame['point']['x'] - $frame['point']['x']);
			break;
		}
	}
	
	if($tx <= 0) {
		if(count($p)) {
			return $p[0]['y'];
		}
		return $curve['frames'][0]['y'];
	}
	if($tx >= 1) {
		if(count($p)) {
			return $p[count($p) - 1]['y'];
		}
		return $curve['frames'][$frameCount - 1]['y'];
	}
	
	$xTolerance = 0.0001;
	$xTarget = $x;
	$myBezier = function($t) {
		$mt = 1 - $t;
		$mt2 = $mt * $mt;
		$t2 = $t * $t;
		
		$a = $mt2 * $mt;
		$b = $mt2 * $t * 3;
		$c = $mt * $t2 * 3;
		$d = $t * $t2;
		
		return [
			'x' => $a * $p[0]['x'] + $b * $p[1]['x'] + $c * $p[2]['x'] + $d * $p[3]['x'],
			'y' => $a * $p[0]['y'] + $b * $p[1]['y'] + $c * $p[2]['y'] + $d * $p[3]['y']
		];
	};
	
	$lower = 0;
	$upper = 1;
	$percent = ($upper + $lower) / 2;
	
	$testX = $myBezier($percent)['x'];
	while(abs($xTarget - $testX) > $xTolerance) {
		if($xTarget > $testX) {
			$lower = $percent;
		} else {
			$upper = $percent;
		}
		
		$percent = ($upper + $lower) / 2;
		$testX = $myBezier($percent)['x'];
	}
	
	return $myBezier($percent)['y'];
}

function generate($data) {
	$frequency = $data['note'] * pow(2, $data['octave'] - 4);
	$sampleRate = $data['sampleRate'];
	$sampleCount = $data['duration'] * $sampleRate;
	$volume = $data['volume'];
	
	$result = [];
	for($s = 0; $s < $sampleCount; $s++) {
		$t = $s / $sampleCount;
		$f = $frequency + ($frequency * get_curve_value($data['frequencyCurve'], $t));
		$a = get_curve_value($data['amplitudeCurve'], $t);
		
		$v = (int)(
			$volume *
			$a *
			get_curve_value($data['wave'], ($s / $sampleRate) * $f) *
			32768
		);

		$result[] = $v;
		/*$result[$s << 1] = $v;
		$result[($s << 1) + 1] = $v >> 8;*/
	}
	
	$channels = 1;
	$resultLength = count($result) * 2;
	$bitsPerSample = 16;
	
	return call_user_func_array("pack",
		array_merge(array("VVVVVvvVVvvVVv*"),
			array(//header
				0x46464952, //RIFF
				/*160038*//*4 + (8 + 24) + (8 + 8)*/$resultLength * $channels * $bitsPerSample / 8 + 46,      //File size
				0x45564157, //WAVE
				0x20746d66, //"fmt " (chunk)
				16, //chunk size
				1, //compression
				$channels, //nchannels
				$sampleRate, //sample rate
				$sampleRate * $channels * $bitsPerSample / 8, //bytes/second
				$channels * $bitsPerSample / 8, //block align
				$bitsPerSample, //bits/sample
				0x61746164, //"data"
				$resultLength * $channels * $bitsPerSample / 8 //chunk size
			),
			$result //data
		)
	);
	/*return [
		'RIFF',
		packv(1, 4 + (8 + 24) + (8 + 8)), // Length
		'WAVE',
		// chunk 1
		'fmt ', // Sub-chunk identifier
		packv(1, 16), // Chunk length
		packv(0, 1), // Audio format (1 is linear quantization)
		packv(0, $channels),
		packv(1, $sampleRate),
		packv(1, $sampleRate * $channels * $bitsPerSample / 8), // Byte rate
		packv(0, $channels * $bitsPerSample / 8),
		packv(0, $bitsPerSample),
		// chunk 2
		'data', // Sub-chunk identifier
		packv(1, $resultLength * $channels * $bitsPerSample / 8), // Chunk length
		$result
	];*/
}

header('Content-Description: File Transfer');
header('Content-Transfer-Encoding: binary'); 
header('Content-Type: audio/x-wav');
//header('Content-length: ' . 160038);
//header('Content-Disposition: attachment;filename="sample.wav"');

$data = generate($config);
foreach($data as $d) {
	echo $d;
}
