<?php
$main = 'index.html';
$src = 'src/';
$dst = 'build/';

$contents = file_get_contents($src . $main);

$types = [
	'css' => [
		'tag' => 'link',
		'attribute' => 'href',
		'write' => '<link rel="stylesheet" type="text/css" href="%file%" />',
		'processor' => null
	],
	'js' => [
		'tag' => 'script',
		'attribute' => 'src',
		'write' => '<script type="text/javascript" src="%file%"></script>',
		'processor' => function($src) {
			return $src;	//TODO: minify
		}
	]
];

$builds = [];
foreach($types as $fileType => $type) {
	$builds[$fileType] = [];
	$contents = preg_replace_callback('/(<' . $type['tag'] . '[^>]*>)([^<]*<\s?\/\s?' . $type['tag'] . '\s?>)?/m', function($matches) use (&$builds, $fileType, $type) {
		$source = $matches[0];
		$tag = $matches[1];

		$build = 'build';
		if(!preg_match('/(data-build="([^"]*)"|data-build=\'([^\']*)\')/m', $tag, $matches)) {
			return $source;
		}
		if($matches[2]) $build = $matches[2];
		if($matches[3]) $build = $matches[3];

		$file = false;
		if(!preg_match('/(' . $type['attribute'] . '="([^"]*)"|' . $type['attribute'] . '=\'([^\']*)\')/m', $tag, $matches)) {
			return $source;
		}
		if($matches[2]) $file = $matches[2];
		if($matches[3]) $file = $matches[3];

		if(!isset($builds[$fileType][$build])) {
			$builds[$fileType][$build] = [$file];

			return str_replace('%file%', $build . '.' . $fileType, $type['write']);
		}

		$builds[$fileType][$build][] = $file;

		return '';
	}, $contents);
}

file_put_contents($dst . $main, $contents);

foreach($builds as $fileType => $fileTypeBuilds) {
	$fileTypeConfig = $types[$fileType];
	foreach($fileTypeBuilds as $buildName => $files) {
		$buildContents = '';
		foreach($files as $file) {
			$buildContents .= file_get_contents($src . $file);
		}
		if(isset($fileTypeConfig['processor']) && $fileTypeConfig['processor']) {
			$buildContents = $fileTypeConfig['processor']($buildContents);
		}
		file_put_contents($dst . $buildName . '.' . $fileType, $buildContents);
	}
}

header('Content-Type: text/html');
echo $contents;
