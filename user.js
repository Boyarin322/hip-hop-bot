// user.js
const { DataTypes } = require('sequelize');
const sequelize = require('./sequelize');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    mmr: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        set(value) {
            this.setDataValue('mmr', value);
            this.setDataValue('level', Math.floor(value / 100));
            this.setDataValue('title', this.getDataValue('title')); // Recalculate the title
        },
    },
    nickname: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    level: {
        type: DataTypes.VIRTUAL,
        get() {
            return this.getDataValue('level');
        },
    },
    title: {
        type: DataTypes.VIRTUAL,
        get() {
            const level = this.getDataValue('level');
            switch (level) {
                case level>=0 && level<10:
                    return 'Clown';
                case level>=10 && level<20:
                    return 'Student';
                case level>=20 && level<30:
                    return 'Senior student';
                case level>=30 && level<40:
                    return 'Disciple';
                case level>=40 && level<50:
                    return 'Bachelor';
                case level>=50 && level<60:
                    return 'Master';
                case level>=60 && level<70:
                    return 'Aspirant';
                case level>=70 && level<80:
                    return 'Dozent';
                case level>=80 && level<90:
                    return 'Legend';
                case level>=90 && level<100:
                    return 'Godlike';
                case level>=100:
                    return 'God';
                default:
                    return 'Unknown';
            }
        },
    },
});

module.exports = User;
