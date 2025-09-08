// Définition des clans et leurs couleurs
class ClanColor {
    constructor(name, color_hex, color_name,honneur) {
        this.name = name;
        this.color_hex = color_hex;
        this.color_name = color_name;
        this.honneur = honneur;
        this.verticalOffset = (honneur - 1) * 0.01;
    }
}

// Tableau des codes couleurs hexadécimaux
const COLOR_CODES = {
    black: '#000000',
    red: '#FF0000',
    green: '#008000',
    orange: '#FFA500',
    white: '#FFFFFF',
    blue: '#0000FF',
    purple: '#800080',
    yellow: '#FFFF00',
};

// Les 8 clans ASYMMETRIC
const Mu = new ClanColor('Mu', COLOR_CODES.black, 'black',1);
const Suhey = new ClanColor('Suhey', COLOR_CODES.red, 'red',2);
const Weyu = new ClanColor('Weyu', COLOR_CODES.green, 'green',3);
const Xiang = new ClanColor('Xiang', COLOR_CODES.orange, 'orange',4);
const Huan = new ClanColor('Huan', COLOR_CODES.white, 'white',5);
const Zhuang = new ClanColor('Zhuang', COLOR_CODES.blue, 'blue',6);
const Luong = new ClanColor('Luong', COLOR_CODES.purple, 'purple',7);
const Goujian = new ClanColor('Goujian', COLOR_CODES.yellow, 'yellow',8);

// Les 8 clans BASIC (nommés par leur couleur)
const black_clan = new ClanColor('black_clan', COLOR_CODES.black, 'black',1);
const red_clan = new ClanColor('red_clan', COLOR_CODES.red, 'red',2);
const green_clan = new ClanColor('green_clan', COLOR_CODES.green, 'green',3);
const orange_clan = new ClanColor('orange_clan', COLOR_CODES.orange, 'orange',4);
const white_clan = new ClanColor('white_clan', COLOR_CODES.white, 'white',5);
const blue_clan = new ClanColor('blue_clan', COLOR_CODES.blue, 'blue',6);
const purple_clan = new ClanColor('purple_clan', COLOR_CODES.purple, 'purple',7);
const yellow_clan = new ClanColor('yellow_clan', COLOR_CODES.yellow, 'yellow',8);

// Tableau des clans 
export const ALL_CLANS = [
    Mu,
    Suhey,
    Weyu,
    Xiang,
    Huan,
    Zhuang,
    Luong,
    Goujian,
    black_clan,
    red_clan,
    green_clan,
    orange_clan,
    white_clan,
    blue_clan,
    purple_clan,
    yellow_clan
];



