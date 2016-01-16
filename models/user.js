module.exports = function (sequelize, DataType) {
	return sequelize.define('user', {
		email: {
			type: DataType.STRING,
			allowNull: false,
			unique: true,
			validate: {
				isEmail: true
			}
		},
		password: {
			type: DataType.STRING,
			allowNull: false,
			validate: {
				len: [7, 100]
			}
		}
	});
}