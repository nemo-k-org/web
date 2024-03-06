<?php

declare(strict_types=1);

namespace NemoK\Migrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20240305064403 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create table `customers`';
    }

    public function up(Schema $schema): void
    {
        $this->addSql("
            CREATE TABLE `customers` (
                `customerId` INT NOT NULL AUTO_INCREMENT ,
                `customerCode` CHAR(36) NOT NULL COMMENT 'Customer-specific UUID for authentication' ,
                `email` VARCHAR(128) NOT NULL COMMENT 'Customer email' ,
                `added` DATETIME NOT NULL COMMENT 'When customer was added' ,
                `lastAction` TIMESTAMP NOT NULL COMMENT 'Last observed action for the user' ,
                PRIMARY KEY (`customerId`)
            ) ENGINE = InnoDB COMMENT = 'Customer data'; 
        ");
    }

    public function down(Schema $schema): void
    {
        $this->addSql("DROP TABLE `customers`;");
    }
}
