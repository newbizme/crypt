'use strict';

module.exports = (sequelize, DataTypes) => {

    var Setting = sequelize.define(
        'Setting',
        {
            key: DataTypes.STRING,
            value: DataTypes.STRING,
            type: {
                type: DataTypes.SMALLINT,
                allowNull: false
            }
        },
        modelProps(
            'setting',
            'This table contains system settings (set by admins)'
        )
    );


    return Setting;
};