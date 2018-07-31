<?php
$type = $_GET['type'];
$mime_type = false;
switch($type) {
	case 'css':
		$mime_type = 'text/css';
		break;
	case 'js':
		$mime_type = 'text/javascript';
		break;
	default:
		die('invalid type.');
}

$root = 'src';

$iter = new RecursiveIteratorIterator(
	new RecursiveDirectoryIterator($root, RecursiveDirectoryIterator::SKIP_DOTS),
	RecursiveIteratorIterator::SELF_FIRST,
	RecursiveIteratorIterator::CATCH_GET_CHILD // Ignore "Permission denied"
);

//$stack = [];
$content = '';
foreach ($iter as $path => $dir) {
	if($dir->isDir() || strpos($path,'.' . $type) !== strlen($path) - (strlen($type) + 1)) {
		continue;
	}
	//$stack[] = $path;

	$file = file_get_contents($path);

	$content = $file . $content;
}

file_put_contents('build/build.' . $type, $content);

header('Content-Type: ' . $mime_type);
echo $content;