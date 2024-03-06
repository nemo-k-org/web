<?php

declare(strict_types=1);

namespace NemoK\Migrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20240306183133 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add column "customerId" to table "jobs"';
    }

    public function up(Schema $schema): void
    {
        $this->addSql("
            ALTER TABLE `jobs`
            ADD `customerId` INT NOT NULL COMMENT 'Customer ID of the job owner. Refers to table \"customers\"'
            AFTER `parameters`;
            ");
    }

    public function down(Schema $schema): void
    {
        $this->addSql("ALTER TABLE `jobs` DROP `customerId`; ");
    }
}
