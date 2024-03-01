<?php

declare(strict_types=1);

namespace NemoK\Migrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20240228185428 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create table `jobs`';
    }

    public function up(Schema $schema): void
    {
        $this->addSql("
            CREATE TABLE `jobs` (
                `jobId` CHAR(36) NOT NULL COMMENT 'Unique UUID of the job' ,
                `parameters` JSON NULL DEFAULT NULL COMMENT 'JSON-formatted string containing job parameters' ,
                `userAgentId` INT UNSIGNED NOT NULL COMMENT 'User\'s user agent' ,
                `ip` VARCHAR(45) NOT NULL COMMENT 'User\'s IPv4 or IPv6 address' ,
                UNIQUE (`jobId`)
            ) ENGINE = InnoDB COMMENT = 'Firmware compilation jobs';
        ");
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE `jobs`;');

    }
}
