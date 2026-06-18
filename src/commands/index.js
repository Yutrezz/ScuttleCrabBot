import { cardCommand } from './card.js';
import { playerCommand } from './player.js';

export const commands = [cardCommand, playerCommand];

export const commandMap = new Map(commands.map((command) => [command.data.name, command]));
