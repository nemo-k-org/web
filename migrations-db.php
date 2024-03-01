<?php

require_once("vendor/autoload.php");
require_once("src/api/local-settings.php");

use Doctrine\DBAL\DriverManager;

return DriverManager::getConnection(DB_ADMIN);

?>
