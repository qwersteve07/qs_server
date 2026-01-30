const receiveMessage = async (ctx) => {
	const body = ctx.request.body;
	console.log(body);
	const parseData = JSON.parse(body);

	ctx.status = 200;
	ctx.body = { message: "Data received", data: parseData };
};

export default { receiveMessage };
