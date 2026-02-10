import bcrypt from "bcryptjs";

export const socialDanceUsers = [
	{
		id: 1,
		username: "qwersteve07",
		password: bcrypt.hashSync("asdfjames07", 10),
		role: "superUser",
	},
	{
		id: 2,
		username: "j606888",
		password: bcrypt.hashSync("j606888", 10),
		role: "user",
	},
	{
		id: 3,
		username: "crazyvicky",
		password: bcrypt.hashSync("crazyvicky", 10),
		role: "user",
	},
	{
		id: 4,
		username: "bailalo",
		password: bcrypt.hashSync("bailaloDanceStudio", 10),
		role: "bailalo-dance-studio",
	},
	{
		id: 5,
		username: "flow",
		password: bcrypt.hashSync("flowTaipei", 10),
		role: "flow-taipei",
	},
	{
		id: 6,
		username: "lasalsa",
		password: bcrypt.hashSync("lasalsaTaipei", 10),
		role: "la-salsa-taipei",
	},
	{
		id: 7,
		username: "copa",
		password: bcrypt.hashSync("copaTaiwan", 10),
		role: "copa-taiwan",
	},
	{
		id: 8,
		username: "izouk",
		password: bcrypt.hashSync("izoukFinn", 10),
		role: "FeM",
	},
	{
		id: 9,
		username: "sbk-taiwan",
		password: bcrypt.hashSync("sbkTaiwan", 10),
		role: "sbk-taiwan",
	},
	{
		id: 10,
		username: "leo",
		password: bcrypt.hashSync("leoleo", 10),
		role: "leo",
	},
	{
		id: 11,
		username: "bachata-taiwan",
		password: bcrypt.hashSync("bachataTaiwan", 10),
		role: "bachata-taiwan",
	},
];
