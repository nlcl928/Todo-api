var cryptojs = require('crypto-js');

module.exports = function (sequelize, DataType) {
	
	return sequelize.define('token', {
		token: {
			type: DataType.VIRTUAL,
			allowNULL: false,
			validate: {
				len: [1]
			},
			set: function (value) {
				var hash = cryptojs.MD5(value).toString();
				this.setDataValue('token', value);
				this.setDataValue('tokenHash', hash);
			}
		},
		tokenHash: DataType.STRING
	});
};