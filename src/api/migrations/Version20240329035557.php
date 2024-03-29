<?php

declare(strict_types=1);

namespace NemoK\Migrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20240329035557 extends AbstractMigration
{
    public function getDescription(): string
    {
        return "Changed timestamp to microseconds to put 'create' and 'submitted' to perfect order";
    }

    public function up(Schema $schema): void
    {
        $this->addSql(
            "ALTER TABLE `status` CHANGE `updated` `updated` TIMESTAMP(6) on update CURRENT_TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'Updated';"
        );
    }

    public function down(Schema $schema): void
    {
        $this->addSql(
            "ALTER TABLE `status` CHANGE `updated` `updated` TIMESTAMP() on update CURRENT_TIMESTAMP() NOT NULL DEFAULT CURRENT_TIMESTAMP() COMMENT 'Updated';"
        );
    }
}
