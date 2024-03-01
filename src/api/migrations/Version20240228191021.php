<?php

declare(strict_types=1);

namespace NemoK\Migrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20240228191021 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create table `status`';
    }

    public function up(Schema $schema): void
    {
        $this->addSql("
            CREATE TABLE `status` (
                `jobId` CHAR(36) NOT NULL COMMENT 'Refers to table \'jobs\'' ,
                `jobStatus` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Job status code' ,
                `updated` TIMESTAMP NOT NULL COMMENT 'Updated' 
            ) ENGINE = InnoDB COMMENT = 'Job statuses, appended on progress, last one for the given jobId is the valid status';
        ");
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE `status`;');

    }
}
