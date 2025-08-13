-- Create refresh_tokens table for JWT refresh token storage
CREATE TABLE IF NOT EXISTS `refresh_tokens` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `token` varchar(255) NOT NULL COMMENT 'Hashed refresh token',
  `jti` varchar(36) NOT NULL COMMENT 'JWT ID for token invalidation',
  `expires_at` datetime NOT NULL,
  `revoked` tinyint(1) NOT NULL DEFAULT '0',
  `revoked_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `jti` (`jti`),
  KEY `user_id` (`user_id`),
  KEY `expires_at` (`expires_at`),
  KEY `revoked` (`revoked`),
  CONSTRAINT `refresh_tokens_ibfk_1` 
    FOREIGN KEY (`user_id`) 
    REFERENCES `users` (`user_id`) 
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add index for faster lookups
ALTER TABLE `refresh_tokens` ADD INDEX `idx_refresh_tokens_user_id` (`user_id`);
ALTER TABLE `refresh_tokens` ADD INDEX `idx_refresh_tokens_jti` (`jti`);

-- Create a stored procedure to clean up expired tokens
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS `cleanup_expired_tokens`()
BEGIN
    DELETE FROM `refresh_tokens` 
    WHERE `expires_at` < NOW() 
    OR (`revoked` = 1 AND `revoked_at` < DATE_SUB(NOW(), INTERVAL 7 DAY));
END //
DELIMITER ;

-- Create an event to run the cleanup daily
CREATE EVENT IF NOT EXISTS `cleanup_expired_tokens_event`
ON SCHEDULE EVERY 1 DAY
DO CALL `cleanup_expired_tokens`();