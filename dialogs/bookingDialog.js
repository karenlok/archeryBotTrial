// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { TimexProperty } = require('@microsoft/recognizers-text-data-types-timex-expression');
const { InputHints, MessageFactory } = require('botbuilder');
const { ConfirmPrompt, TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');
const { CancelAndHelpDialog } = require('./cancelAndHelpDialog');
const { DateResolverDialog } = require('./dateResolverDialog');

const CONFIRM_PROMPT = 'confirmPrompt';
const DATE_RESOLVER_DIALOG = 'dateResolverDialog';
const TEXT_PROMPT = 'textPrompt';
const WATERFALL_DIALOG = 'waterfallDialog';

const { ConnectAndQuery } = require('../db');

class BookingDialog extends CancelAndHelpDialog {
    constructor(id) {
        super(id || 'bookingDialog');

        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new ConfirmPrompt(CONFIRM_PROMPT))
            .addDialog(new DateResolverDialog(DATE_RESOLVER_DIALOG))
            .addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
                this.destinationStep.bind(this),
                this.originStep.bind(this),
                // this.travelDateStep.bind(this),
                this.confirmStep.bind(this),
                this.finalStep.bind(this)
            ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    /**
     * If a destination city has not been provided, prompt for one.
     */
    async destinationStep(stepContext) {
        const competitionDetails = stepContext.options;
        console.log('booking details: ', competitionDetails);

        if (!competitionDetails.location) {
            const messageText = 'In which city do you want to check for archery competitions?';
            const msg = MessageFactory.text(messageText, messageText, InputHints.ExpectingInput);
            return await stepContext.prompt(TEXT_PROMPT, { prompt: msg });
        }
        return await stepContext.next(competitionDetails.location);
    }

    /**
     * If an origin city has not been provided, prompt for one.
     */
    async originStep(stepContext) {
        const competitionDetails = stepContext.options;

        // Capture the response to the previous step's prompt
        competitionDetails.location = stepContext.result;
        if (!competitionDetails.date) {
            const messageText = 'On which date do you want to check for archery competitions?';
            const msg = MessageFactory.text(messageText, 'On which date do you want to check for archery competitions?', InputHints.ExpectingInput);
            return await stepContext.prompt(TEXT_PROMPT, { prompt: msg });
        }
        return await stepContext.next(competitionDetails.date);
    }

    /**
     * If a travel date has not been provided, prompt for one.
     * This will use the DATE_RESOLVER_DIALOG.
     */
    // async travelDateStep(stepContext) {
    //     const bookingDetails = stepContext.options;

    //     // Capture the results of the previous step
    //     bookingDetails.origin = stepContext.result;
    //     if (!bookingDetails.travelDate || this.isAmbiguous(bookingDetails.travelDate)) {
    //         return await stepContext.beginDialog(DATE_RESOLVER_DIALOG, { date: bookingDetails.travelDate });
    //     }
    //     return await stepContext.next(bookingDetails.travelDate);
    // }

    /**
     * Confirm the information the user has provided.
     */
    async confirmStep(stepContext) {
        const competitionDetails = stepContext.options;

        // Capture the results of the previous step
        competitionDetails.travelDate = stepContext.result;
        // const messageText = `Please confirm, I have you traveling to: ${ competitionDetails.destination } from: ${ competitionDetails.origin } on: ${ competitionDetails.travelDate }. Is this correct?`;
        let text = "";
        let result = await ConnectAndQuery(competitionDetails.location, competitionDetails.date);
        result.forEach(row => {
            text += row.CompetitionName + " in " + row.Location + " on " + row.Date + '\r\n';
            console.log("%s\t%s\t%s\t%s", row.CompetitionID, row.CompetitionName, row.Location, row.Date);
        });

        text += "Is this what you are looking for?";

        const msg = MessageFactory.text(text, text, InputHints.ExpectingInput);

        // Offer a YES/NO prompt.
        return await stepContext.prompt(CONFIRM_PROMPT, { prompt: msg });
    }

    /**
     * Complete the interaction and end the dialog.
     */
    async finalStep(stepContext) {
        if (stepContext.result === true) {
            const competitionDetails = stepContext.options;
            return await stepContext.endDialog(competitionDetails);
        }
        return await stepContext.endDialog();
    }

    isAmbiguous(timex) {
        const timexPropery = new TimexProperty(timex);
        return !timexPropery.types.has('definite');
    }
}

module.exports.BookingDialog = BookingDialog;
