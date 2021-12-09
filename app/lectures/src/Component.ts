import UIComponent from "sap/ui/core/UIComponent";
import Device from "sap/ui/Device";
import JSONModel from "sap/ui/model/json/JSONModel";
import ODataModel from "sap/ui/model/odata/v4/ODataModel";

/**
 * @namespace lectures
 */
export default class Component extends UIComponent {

    public static metadata = {
        manifest: "json"
    };

    public init(): void {
        // call the base component's init function
        super.init();

        // enable routing
        this.getRouter().initialize();

        // set the device model
        const deviceModel = new JSONModel(Device);
        deviceModel.setDefaultBindingMode("OneWay");
        this.setModel(deviceModel, "device");

        // set backend error model + check metadata availability
        const errorModel = new JSONModel(),
            dataModel = this.getModel() as ODataModel,
            metaModel = dataModel.getMetaModel();

        metaModel.requestData().then(() => {
            errorModel.setProperty("/metadataLoaded", true);
        }).catch((error: Error) => {
            errorModel.setProperty("/metadataLoaded", false);
            errorModel.setProperty("/metadataMessage", error.message);
        }).finally(() => {
            this.setModel(errorModel, "error");
        })

        // set user model for role checks
        const userModel = new JSONModel();
        fetch("/userInfo").then(async (res) => {
            if (res.ok) {
                const data = await res.json() as object;
                userModel.setData(data);
                userModel.setProperty("/userInfoLoaded", true);
            } else {
                userModel.setProperty("/userInfoLoaded", false);
            }
        }).catch((error: Error) => {
            userModel.setProperty("/userInfoLoaded", false);
        }).finally(() => {
            this.setModel(userModel, "user");
        });
    }
}