export const MATRICULA_NAMES = {
  A01643496: 'Baltazar S.',
  A01644423: 'Luis G.',
  A01644875: 'Ana P.',
  A01639866: 'Ana E.',
  A01644644: 'Jozef H.',
};

export const devName = (email) => {
  if (!email) return email;
  const matricula = email.split('@')[0].toUpperCase();
  return MATRICULA_NAMES[matricula] ?? matricula;
};
