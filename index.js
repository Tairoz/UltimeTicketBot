
const { Client, GatewayIntentBits, Partials, Collection, Events, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ChannelType, PermissionsBitField } = require('discord.js');
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
    partials: [Partials.Channel]
});
const config = require('./config.json');
client.once(Events.ClientReady, () => {
    console.log(`✅ UltraTickets prêt en tant que ${client.user.tag}`);
});
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isButton()) return;
    if (interaction.customId === 'open_ticket') {
        const existing = interaction.guild.channels.cache.find(c => c.name === `ticket-${interaction.user.username}`);
        if (existing) {
            await interaction.reply({ content: '❌ Tu as déjà un ticket ouvert.', ephemeral: true });
            return;
        }
        const ticketChannel = await interaction.guild.channels.create({
            name: `ticket-${interaction.user.username}`,
            type: ChannelType.GuildText,
            parent: config.categoryId || null,
            permissionOverwrites: [
                { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel] },
                { id: config.staffRoleId, allow: [PermissionsBitField.Flags.ViewChannel] }
            ]
        });
        const closeButton = new ButtonBuilder().setCustomId('close_ticket').setLabel('🔒 Fermer le ticket').setStyle(ButtonStyle.Danger);
        const closeRow = new ActionRowBuilder().addComponents(closeButton);
        const embed = new EmbedBuilder()
            .setTitle('🎫 Ticket Ouvert')
            .setDescription(`Bonjour ${interaction.user}, un membre du staff te répondra bientôt.
Utilise le bouton ci-dessous pour fermer le ticket lorsque c'est terminé.`)
            .setColor(0x3498db);
        await ticketChannel.send({ content: `<@${interaction.user.id}> <@&${config.staffRoleId}>`, embeds: [embed], components: [closeRow] });
        await interaction.reply({ content: `✅ Ticket créé : ${ticketChannel}`, ephemeral: true });
    }
    if (interaction.customId === 'close_ticket') {
        const channel = interaction.channel;
        await interaction.reply({ content: '🔒 Ticket fermé. Ce salon sera supprimé dans 5 secondes.', ephemeral: true });
        const messages = await channel.messages.fetch({ limit: 100 });
        let transcript = '';
        messages.reverse().forEach(msg => {
            transcript += `${msg.author.tag}: ${msg.content}\n`;
        });
        const transcriptChannel = interaction.guild.channels.cache.get(config.transcriptChannelId);
        if (transcriptChannel) {
            await transcriptChannel.send({ content: `Transcript de ${channel.name}`, files: [{ attachment: Buffer.from(transcript, 'utf-8'), name: `${channel.name}.txt` }] });
        }
        setTimeout(() => {
            channel.delete().catch(() => {});
        }, 5000);
    }
});
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName === 'setup-ticket') {
        const embed = new EmbedBuilder()
            .setTitle('🎫 Ouvre un ticket')
            .setDescription('Clique sur le bouton ci-dessous pour ouvrir un ticket et recevoir de l'aide.')
            .setColor(0x3498db);
        const button = new ButtonBuilder().setCustomId('open_ticket').setLabel('🎫 Ouvrir un ticket').setStyle(ButtonStyle.Primary);
        const row = new ActionRowBuilder().addComponents(button);
        await interaction.reply({ embeds: [embed], components: [row] });
    }
});
client.login(config.token);
