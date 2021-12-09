import BaseController from "lectures/controller/BaseController";
import Popover from "sap/m/Popover";
import Avatar from "sap/m/Avatar";

/**
 * @namespace lectures.controller
 */
export default class MainView extends BaseController {
    private logoutPopover: Popover;

    public async handleAvatarPress(): Promise<void> {
        const avatar = this.getView().byId("avatar") as Avatar;
        await this.showLogoutPopover(avatar);
    }

    public logout(this: void): void {
        window.location.replace('/logout');
    }

    private async showLogoutPopover(avatar: Avatar): Promise<void> {
        if (!this.logoutPopover) {
            try {
                this.logoutPopover = await this.loadFragment({
                    name: "lectures.fragments.LogoutPopover"
                }) as Popover;
            } catch (error) {
                console.log(this.resourceBundle.getText("fragmentLoadErr", [error]));
            }
        }

        this.logoutPopover.openBy(avatar, false);
    }
}