const { DataTypes } = require('sequelize');

/**
 * @param {import('sequelize').QueryInterface} queryInterface
 * @param {import('sequelize').Sequelize} Sequelize
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('user_profile_photos', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users', // users 테이블과 연결
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: '사용자 ID (users 테이블 참조)'
      },
      mime_type: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: '이미지 MIME 타입 (예: image/jpeg, image/png)'
      },
      photo_blob: {
        type: DataTypes.BLOB('long'),
        allowNull: false,
        comment: '이미지 바이너리 데이터'
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: '생성 일시'
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
        comment: '수정 일시'
      }
    }, {
      timestamps: false,
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      comment: '사용자 프로필 사진 정보'
    });

    // user_id에 대한 유니크 인덱스 추가 (한 사용자당 하나의 프로필 사진만 유지)
    await queryInterface.addIndex('user_profile_photos', ['user_id'], {
      unique: true,
      name: 'idx_user_profile_photos_user_id'
    });

    console.log('✅ user_profile_photos 테이블 생성 완료');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('user_profile_photos');
    console.log('❌ user_profile_photos 테이블 삭제 완료');
  }
};
