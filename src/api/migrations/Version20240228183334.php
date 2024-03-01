<?php

declare(strict_types=1);

namespace NemoK\Migrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20240228183334 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create table `userAgents`';
    }

    public function up(Schema $schema): void
    {
        $this->addSql("CREATE TABLE `userAgents` (
            `userAgentId` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Unique ID of an user agent' ,
            `hash` CHAR(64) NOT NULL COMMENT 'SHA256 calculated from user agent string' ,
            `userAgent` BLOB NOT NULL COMMENT 'The complete user agent string' ,
            `added` TIMESTAMP NOT NULL COMMENT 'When this useragent was first identified' ,
            PRIMARY KEY (`userAgentId`)
            )
            ENGINE = InnoDB COMMENT = 'Known user agents'"
        );
    }

    public function down(Schema $schema): void
    {
        $this->addSql("DROP TABLE `userAgents`");
    }
}
