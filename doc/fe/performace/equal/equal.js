function excutor(count, name, v1, v2) {
  console.time(name + '==');
  for (let i=0; i<count; i++) {
    v1 == v2;
  }
  console.timeEnd(name + '==');

  console.time(name + '===');
  for (let i=0; i<count; i++) {
    v1 === v2;
  }
  console.timeEnd(name + '===');
}

var count = 1e6;
var obj = {a:{b:{c: {d: {e:{f: {h: 3}}}}}}};
var cp = obj;
excutor(count, 'number', 1, 1);
excutor(count, 'boolean', true, false);
excutor(count, 'string', '2223', '4443');
excutor(count, 'object', obj, cp);
excutor(count, 'date', new Date(), new Date());